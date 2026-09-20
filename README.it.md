<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *Il browser più veloce per consentire agli agenti AI di eseguire l'automazione web*

Creato da **[digitalfoundry.ai](https://digitalfoundry.ai/)**

---

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Português](README.pt.md) · [Español](README.es.md) · [Français](README.fr.md) · **Italiano** · [Русский](README.ru.md)

</div>

---

**Jev Browser** è un browser in cui tu e i tuoi agenti AI lavorate in parallelo. I tuoi agenti eseguono i loro compiti nei propri Spaces, spazi di lavoro isolati all'interno dello stesso browser, mentre tu continui a navigare indisturbato. Le tue schede e il tuo cursore rimangono sempre sotto il tuo controllo.

Strumenti esistenti come browser-use e agent-browser sono solo ponti esterni verso un browser separato: i dati raramente vengono trasferiti intatti, la connessione è instabile e si finisce per contendersi il controllo del browser. Jev Browser è progettato fin dall'inizio per essere condiviso.

---

## Demo

<div align="center">

[![Guarda la demo di lancio di Jev Browser](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[Guarda il video ufficiale di lancio (20s MP4)](brag-output/brag.mp4)** — Spazi di attività paralleli autonomi basati sull'intelligenza decisionale Jev*

</div>

---

## Avvio Rapido (Quick Start)

Jev Browser funziona su macOS oggi, beta chiusa per Windows in arrivo, e Linux nella roadmap.

### 1. Installazione

```bash
# Installatore macOS in una riga
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

Oppure aggiungi la skill tramite npx:
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

Oppure chiedi al tuo agente:
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

---

## Caratteristiche Principali

- **Esecuzione basata su codice (non su CLI)**: funzioni JavaScript eseguite in-page in un unico passaggio, risparmiando token e velocizzando i flussi.
- **Uno Space dedicato per ogni agente**: isolamento totale delle sessioni senza interferenze.
- **Lo Snapshot di pagina più solido sul mercato**: supporta con precisione iframe annidati e riduce a zero le allucinazioni.
- **Apprendimento ed evoluzione (Jev Intelligence)**: riutilizza flussi di successo rendendo i compiti successivi fino a 5 volte più veloci.

---

## Licenza (License)

Licenza MIT — consulta [LICENSE](LICENSE) e [NOTICE](NOTICE.md).
Creato con orgoglio da **[digitalfoundry.ai](https://digitalfoundry.ai/)**.
