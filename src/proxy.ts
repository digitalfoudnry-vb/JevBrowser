// Browser-only egress proxy. Connect to the validated IP, never resolve the
// hostname a second time in Chromium: this closes the DNS rebinding gap.
import http from "node:http";
import net from "node:net";
import type { Duplex } from "node:stream";
import { publicUrl, resolvePublicHost } from "./security.js";

export async function startPublicProxy(allowedHosts: Set<string>) {
  const sockets = new Set<Duplex>();
  let closed = false;
  const track = <T extends Duplex>(socket: T): T => {
    sockets.add(socket);
    socket.on("error", () => socket.destroy());
    socket.on("close", () => sockets.delete(socket));
    socket.setMaxListeners(20);
    return socket;
  };
  const target = async (value: string) => {
    const url = publicUrl(value);
    if (!allowedHosts.has(url.hostname)) throw new Error("Host outside task scope");
    const address = await resolvePublicHost(url.hostname);
    if (closed) throw new Error("Proxy closed");
    return { url, address };
  };
  const server = http.createServer(async (req, res) => {
    try {
      const { url, address } = await target(req.url ?? "");
      if (url.protocol !== "http:") throw new Error("Use CONNECT for HTTPS");
      const headers: http.OutgoingHttpHeaders = { ...req.headers, host: url.host };
      delete headers["proxy-authorization"];
      delete headers["proxy-connection"];
      const upstream = http.request({ hostname: address, port: Number(url.port || 80), path: url.pathname + url.search,
        method: req.method, headers, agent: false, timeout: 15_000 }, response => {
        res.writeHead(response.statusCode ?? 502, response.headers);
        response.pipe(res);
      });
      upstream.on("socket", track);
      upstream.on("timeout", () => upstream.destroy());
      upstream.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      res.on("close", () => upstream.destroy());
      req.pipe(upstream);
    } catch {
      res.writeHead(403); res.end("Browser network policy blocked this request");
    }
  });
  server.on("connection", track);
  server.on("connect", async (req, client, head) => {
    try {
      const { url, address } = await target(`https://${req.url}`);
      if (url.port && url.port !== "443") throw new Error("CONNECT is restricted to port 443");
      if (client.destroyed) return;
      const upstream = track(net.connect({ host: address, port: 443 }));
      upstream.setTimeout(15_000, () => upstream.destroy());
      upstream.on("connect", () => {
        client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head.length) upstream.write(head);
        upstream.pipe(client); client.pipe(upstream);
      });
      client.on("close", () => upstream.destroy());
      upstream.on("close", () => client.destroy());
    } catch {
      client.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    }
  });
  server.on("upgrade", (_req, socket) => socket.destroy());
  server.on("clientError", (_error, socket) => socket.destroy());
  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address() as net.AddressInfo;
  return {
    server: `http://127.0.0.1:${address.port}`,
    close: async () => {
      closed = true;
      for (const socket of sockets) socket.destroy();
      await new Promise<void>(resolve => server.close(() => resolve()));
    },
  };
}
