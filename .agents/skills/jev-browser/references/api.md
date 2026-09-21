# Jev Browser API Reference

## TaskSpace API

### `taskSpace(nameOrId: string | number, options?: { profileId?: string }): Promise<TaskSpace>`
Creates or resumes a task space.

- `space.spaceId`: Unique numeric ID of this task space.
- `space.name`: Human-readable name given at creation.
- `space.page(label: string)`: Retrieves or attaches a page by label (e.g. `"p1"`).
- `space.close()`: Closes the browser context and releases resources.

## Page API

### `page.goto(url: string, options?: { timeout?: number, waitUntil?: string }): Promise<void>`
Navigates the page to the target URL. Validates against SSRF / private IP addresses.

### `page.snapshot(options?: { fullPage?: boolean }): Promise<{ content: string, refs: PageRef[] }>`
Captures a compact, structured accessibility snapshot of the viewport or entire document.

### `page.click(refOrSelector: string, options?: { label?: string }): Promise<void>`
Clicks an element by ref (e.g. `"@1"`) or CSS selector.

### `page.fill(refOrSelector: string, text: string): Promise<void>`
Focuses, clears, and fills text into an input or textarea element.

### `page.scroll(direction: "up" | "down", options?: { amount?: number }): Promise<void>`
Scrolls the viewport up or down.

### `page.screenshot(options?: { fullPage?: boolean }): Promise<string>`
Returns a base64 encoded JPEG screenshot of the page.

### `page.evaluate(fn: string | Function, ...args: any[]): Promise<any>`
Runs JavaScript inside the web page's browser context.

## Autonomous Jev API

### `jevNavigate(task: string, startUrl: string, options?: JevNavigatorOptions): Promise<JevNavigationResult>`
Executes an autonomous goal from `startUrl` until `done`, `maxSteps`, or `maxSeconds`.
