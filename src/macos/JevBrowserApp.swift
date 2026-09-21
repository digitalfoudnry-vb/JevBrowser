import Cocoa
import WebKit

// Jev Browser — Native macOS Standalone Application
// Created by digitalfoundry.ai (https://digitalfoundry.ai/)

class JevBrowserWindowController: NSWindowController, WKNavigationDelegate, NSTextFieldDelegate {
    var webView: WKWebView!
    var urlField: NSTextField!
    var backButton: NSButton!
    var forwardButton: NSButton!
    var reloadButton: NSButton!
    var statusBadge: NSTextField!
    var progressBar: NSProgressIndicator!

    let defaultURL = URL(string: "http://localhost:8000")!

    convenience init() {
        let window = NSWindow(
            contentRect: NSRect(x: 100, y: 100, width: 1280, height: 840),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Jev Browser"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = false
        window.backgroundColor = NSColor(red: 0.07, green: 0.09, blue: 0.15, alpha: 1.0)
        window.minSize = NSSize(width: 800, height: 600)
        window.center()

        self.init(window: window)
        setupUI()
        loadURL(defaultURL)
    }

    func setupUI() {
        guard let window = self.window else { return }
        let contentView = NSView(frame: window.contentView!.bounds)
        contentView.autoresizingMask = [.width, .height]
        window.contentView = contentView

        // Top Navigation & Control Bar
        let navBarHeight: CGFloat = 52
        let navBar = NSVisualEffectView(frame: NSRect(x: 0, y: window.contentView!.bounds.height - navBarHeight, width: window.contentView!.bounds.width, height: navBarHeight))
        navBar.autoresizingMask = [.width, .minYMargin]
        navBar.material = .sidebar
        navBar.blendingMode = .withinWindow
        navBar.state = .active
        contentView.addSubview(navBar)

        // Navigation Buttons (Left of URL bar, offset for window traffic lights)
        let buttonY: CGFloat = 11
        backButton = NSButton(frame: NSRect(x: 82, y: buttonY, width: 28, height: 28))
        backButton.bezelStyle = .texturedRounded
        backButton.title = "◀"
        backButton.font = NSFont.systemFont(ofSize: 11, weight: .bold)
        backButton.target = self
        backButton.action = #selector(navigateBack)
        backButton.toolTip = "Go Back"
        navBar.addSubview(backButton)

        forwardButton = NSButton(frame: NSRect(x: 114, y: buttonY, width: 28, height: 28))
        forwardButton.bezelStyle = .texturedRounded
        forwardButton.title = "▶"
        forwardButton.font = NSFont.systemFont(ofSize: 11, weight: .bold)
        forwardButton.target = self
        forwardButton.action = #selector(navigateForward)
        forwardButton.toolTip = "Go Forward"
        navBar.addSubview(forwardButton)

        reloadButton = NSButton(frame: NSRect(x: 146, y: buttonY, width: 28, height: 28))
        reloadButton.bezelStyle = .texturedRounded
        reloadButton.title = "⟳"
        reloadButton.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        reloadButton.target = self
        reloadButton.action = #selector(reloadPage)
        reloadButton.toolTip = "Reload Page"
        navBar.addSubview(reloadButton)

        let homeButton = NSButton(frame: NSRect(x: 178, y: buttonY, width: 28, height: 28))
        homeButton.bezelStyle = .texturedRounded
        homeButton.title = "⌂"
        homeButton.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        homeButton.target = self
        homeButton.action = #selector(navigateHome)
        homeButton.toolTip = "Jev Browser Dashboard"
        navBar.addSubview(homeButton)

        // Status Badge (Right side)
        let badgeWidth: CGFloat = 150
        statusBadge = NSTextField(frame: NSRect(x: navBar.bounds.width - badgeWidth - 16, y: buttonY + 3, width: badgeWidth, height: 22))
        statusBadge.autoresizingMask = [.minXMargin]
        statusBadge.isEditable = false
        statusBadge.isBordered = false
        statusBadge.backgroundColor = NSColor(red: 0.1, green: 0.2, blue: 0.35, alpha: 0.6)
        statusBadge.wantsLayer = true
        statusBadge.layer?.cornerRadius = 11
        statusBadge.textColor = NSColor(red: 0.3, green: 0.85, blue: 1.0, alpha: 1.0)
        statusBadge.font = NSFont.systemFont(ofSize: 11, weight: .semibold)
        statusBadge.alignment = .center
        statusBadge.stringValue = "● Jev AI Engine Ready"
        navBar.addSubview(statusBadge)

        // URL Field (Center)
        let urlFieldX: CGFloat = 216
        let urlFieldWidth = navBar.bounds.width - urlFieldX - badgeWidth - 32
        urlField = NSTextField(frame: NSRect(x: urlFieldX, y: buttonY + 2, width: max(urlFieldWidth, 200), height: 25))
        urlField.autoresizingMask = [.width]
        urlField.font = NSFont.systemFont(ofSize: 12)
        urlField.placeholderString = "Search or enter website address..."
        urlField.delegate = self
        urlField.wantsLayer = true
        urlField.layer?.cornerRadius = 6
        urlField.textColor = NSColor.white
        urlField.backgroundColor = NSColor(red: 0.12, green: 0.15, blue: 0.22, alpha: 0.85)
        navBar.addSubview(urlField)

        // Progress Bar
        progressBar = NSProgressIndicator(frame: NSRect(x: 0, y: window.contentView!.bounds.height - navBarHeight - 2, width: window.contentView!.bounds.width, height: 2))
        progressBar.autoresizingMask = [.width, .minYMargin]
        progressBar.isIndeterminate = false
        progressBar.minValue = 0.0
        progressBar.maxValue = 1.0
        progressBar.isHidden = true
        contentView.addSubview(progressBar)

        // Web View (Under the nav bar)
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        let webFrame = NSRect(x: 0, y: 0, width: window.contentView!.bounds.width, height: window.contentView!.bounds.height - navBarHeight)
        webView = WKWebView(frame: webFrame, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.wantsLayer = true
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.title), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.canGoBack), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.canGoForward), options: .new, context: nil)
        contentView.addSubview(webView)
    }

    func loadURL(_ url: URL) {
        urlField.stringValue = url.absoluteString
        let request = URLRequest(url: url)
        webView.load(request)
    }

    @objc func navigateBack() {
        if webView.canGoBack { webView.goBack() }
    }

    @objc func navigateForward() {
        if webView.canGoForward { webView.goForward() }
    }

    @objc func reloadPage() {
        webView.reload()
    }

    @objc func navigateHome() {
        loadURL(defaultURL)
    }

    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        if commandSelector == #selector(NSResponder.insertNewline(_:)) {
            var text = urlField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if !text.isEmpty {
                if !text.contains("://") {
                    if text.contains(".") && !text.contains(" ") {
                        text = "https://" + text
                    } else {
                        let query = text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? text
                        text = "https://www.google.com/search?q=" + query
                    }
                }
                if let url = URL(string: text) {
                    loadURL(url)
                }
            }
            return true
        }
        return false
    }

    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == #keyPath(WKWebView.estimatedProgress) {
            let progress = webView.estimatedProgress
            progressBar.doubleValue = progress
            progressBar.isHidden = progress >= 1.0
        } else if keyPath == #keyPath(WKWebView.title) {
            if let title = webView.title, !title.isEmpty {
                window?.title = "\(title) — Jev Browser"
            } else {
                window?.title = "Jev Browser"
            }
        } else if keyPath == #keyPath(WKWebView.canGoBack) {
            backButton.isEnabled = webView.canGoBack
        } else if keyPath == #keyPath(WKWebView.canGoForward) {
            forwardButton.isEnabled = webView.canGoForward
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let currentURL = webView.url {
            urlField.stringValue = currentURL.absoluteString
        }
    }

    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.title))
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.canGoBack))
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.canGoForward))
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var windowController: JevBrowserWindowController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Ensure local website/dashboard server is running
        startBackgroundServerIfNeeded()

        // Create main window
        let controller = JevBrowserWindowController()
        controller.showWindow(nil)
        self.windowController = controller

        // Set up main menu
        setupMenuBar()

        NSApp.activate(ignoringOtherApps: true)
    }

    func startBackgroundServerIfNeeded() {
        let url = URL(string: "http://localhost:8000/")!
        var request = URLRequest(url: url)
        request.timeoutInterval = 0.5
        let semaphore = DispatchSemaphore(value: 0)
        var isRunning = false

        let task = URLSession.shared.dataTask(with: request) { _, response, _ in
            if let http = response as? HTTPURLResponse, http.statusCode < 500 {
                isRunning = true
            }
            semaphore.signal()
        }
        task.resume()
        _ = semaphore.wait(timeout: .now() + 0.6)

        if !isRunning {
            let serverScript = locateServerScript()
            if let script = serverScript {
                let process = Process()
                process.executableURL = URL(fileURLWithPath: "/usr/local/bin/node")
                if !FileManager.default.fileExists(atPath: process.executableURL!.path) {
                    process.executableURL = URL(fileURLWithPath: "/opt/homebrew/bin/node")
                }
                process.arguments = [script]
                var env = ProcessInfo.processInfo.environment
                env["PORT"] = "8000"
                process.environment = env
                try? process.run()
                Thread.sleep(forTimeInterval: 0.6)
            }
        }
    }

    func locateServerScript() -> String? {
        let bundlePath = Bundle.main.bundlePath
        let candidates = [
            "\(bundlePath)/../../../../scripts/serve-website.mjs",
            "\(NSHomeDirectory())/JEVBROWSER/scripts/serve-website.mjs",
            "/Users/vikrambala/JEVBROWSER/scripts/serve-website.mjs",
            "\(NSHomeDirectory())/.jev-browser/scripts/serve-website.mjs"
        ]
        for candidate in candidates {
            let normalized = (candidate as NSString).standardizingPath
            if FileManager.default.fileExists(atPath: normalized) {
                return normalized
            }
        }
        return nil
    }

    func setupMenuBar() {
        let mainMenu = NSMenu()

        // Application Menu
        let appMenuItem = NSMenuItem()
        let appMenu = NSMenu(title: "Jev Browser")
        appMenu.addItem(withTitle: "About Jev Browser", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Jev Browser", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = NSMenuItem(title: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(hideOthers)
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Jev Browser", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // File Menu
        let fileMenuItem = NSMenuItem()
        let fileMenu = NSMenu(title: "File")
        fileMenu.addItem(withTitle: "New Window", action: #selector(newWindow), keyEquivalent: "n")
        fileMenu.addItem(withTitle: "Open Location...", action: #selector(openLocation), keyEquivalent: "l")
        fileMenu.addItem(NSMenuItem.separator())
        fileMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileMenuItem.submenu = fileMenu
        mainMenu.addItem(fileMenuItem)

        // Edit Menu
        let editMenuItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(withTitle: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        // View Menu
        let viewMenuItem = NSMenuItem()
        let viewMenu = NSMenu(title: "View")
        viewMenu.addItem(withTitle: "Reload Page", action: #selector(reloadActivePage), keyEquivalent: "r")
        viewMenu.addItem(withTitle: "Back", action: #selector(backActivePage), keyEquivalent: "[")
        viewMenu.addItem(withTitle: "Forward", action: #selector(forwardActivePage), keyEquivalent: "]")
        viewMenuItem.submenu = viewMenu
        mainMenu.addItem(viewMenuItem)

        // Window Menu
        let windowMenuItem = NSMenuItem()
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowMenuItem.submenu = windowMenu
        mainMenu.addItem(windowMenuItem)

        // Help Menu
        let helpMenuItem = NSMenuItem()
        let helpMenu = NSMenu(title: "Help")
        helpMenu.addItem(withTitle: "Visit digitalfoundry.ai", action: #selector(openWebsite), keyEquivalent: "")
        helpMenuItem.submenu = helpMenu
        mainMenu.addItem(helpMenuItem)

        NSApp.mainMenu = mainMenu
    }

    @objc func showAbout() {
        let alert = NSAlert()
        alert.messageText = "Jev Browser"
        alert.informativeText = "The fastest browser for AI agents to run web automation.\n\nVersion 0.1.0\nCreated by digitalfoundry.ai\nhttps://digitalfoundry.ai/"
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    @objc func newWindow() {
        let controller = JevBrowserWindowController()
        controller.showWindow(nil)
    }

    @objc func openLocation() {
        windowController?.urlField.selectText(nil)
    }

    @objc func reloadActivePage() {
        windowController?.reloadPage()
    }

    @objc func backActivePage() {
        windowController?.navigateBack()
    }

    @objc func forwardActivePage() {
        windowController?.navigateForward()
    }

    @objc func openWebsite() {
        if let url = URL(string: "https://digitalfoundry.ai/") {
            NSWorkspace.shared.open(url)
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Entry Point
let args = CommandLine.arguments
if args.count > 1 && (args[1] == "run" || args[1] == "--help" || args[1] == "-h") {
    // If CLI args provided, invoke node CLI
    let nodePaths = ["/usr/local/bin/node", "/opt/homebrew/bin/node"]
    var nodeExec: String?
    for path in nodePaths {
        if FileManager.default.fileExists(atPath: path) {
            nodeExec = path
            break
        }
    }
    let node = nodeExec ?? "/usr/bin/env node"
    let candidates = [
        "\(Bundle.main.bundlePath)/../../../../dist/index.js",
        "\(NSHomeDirectory())/JEVBROWSER/dist/index.js",
        "/Users/vikrambala/JEVBROWSER/dist/index.js",
        "\(NSHomeDirectory())/.jev-browser/dist/index.js"
    ]
    var scriptPath: String?
    for candidate in candidates {
        let normalized = (candidate as NSString).standardizingPath
        if FileManager.default.fileExists(atPath: normalized) {
            scriptPath = normalized
            break
        }
    }
    if let script = scriptPath {
        let process = Process()
        if node.hasPrefix("/") {
            process.executableURL = URL(fileURLWithPath: node)
            process.arguments = [script] + Array(args.dropFirst())
        } else {
            process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            process.arguments = ["node", script] + Array(args.dropFirst())
        }
        try? process.run()
        process.waitUntilExit()
        exit(process.terminationStatus)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
