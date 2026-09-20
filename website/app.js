/**
 * Jev Browser — Landing Page Interactive Engine
 * Created by digitalfoundry.ai (https://digitalfoundry.ai/)
 */

document.addEventListener('DOMContentLoaded', () => {
  initVideoPlayer();
  initSpacesSimulator();
  initInstallTabs();
});

/* ==========================================================================
   1. Video Player & Scene Timeline Controls
   ========================================================================== */
function initVideoPlayer() {
  const video = document.getElementById('launch-video');
  const sceneTabs = document.querySelectorAll('.scene-tab-btn');

  if (!video || !sceneTabs.length) return;

  sceneTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const time = parseFloat(tab.getAttribute('data-time'));
      if (!isNaN(time)) {
        video.currentTime = time;
        video.play();
        setActiveSceneTab(tab);
      }
    });
  });

  video.addEventListener('timeupdate', () => {
    const curr = video.currentTime;
    let activeIndex = 0;

    if (curr >= 17.0) activeIndex = 4;
    else if (curr >= 13.0) activeIndex = 3;
    else if (curr >= 7.5) activeIndex = 2;
    else if (curr >= 3.2) activeIndex = 1;
    else activeIndex = 0;

    sceneTabs.forEach((tab, idx) => {
      if (idx === activeIndex) tab.classList.add('active');
      else tab.classList.remove('active');
    });
  });
}

function setActiveSceneTab(activeTab) {
  document.querySelectorAll('.scene-tab-btn').forEach(t => t.classList.remove('active'));
  activeTab.classList.add('active');
}

/* ==========================================================================
   2. Parallel Spaces Interactive Simulator
   ========================================================================== */
const SPACES_DATA = {
  'user': {
    status: 'User Focused • Uninterrupted',
    meta: 'Active Window: Human Profile (Chrome)',
    previewHtml: `
      <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; border: 1px solid var(--border-glass);">
        <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 0.85rem;">
          <span style="background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 4px; color: #fff;">📁 Work Mail</span>
          <span style="background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 4px; color: #fff;">📊 Q3 Financials</span>
          <span style="background: rgba(0,242,254,0.15); padding: 4px 10px; border-radius: 4px; color: var(--accent-cyan);">🌐 Active: Figma Dashboard</span>
        </div>
        <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6;">
          <strong>You are working normally:</strong> Reading emails, typing in Slack, and adjusting layouts. No popup windows appear, no agent clicks steal your focus, and your mouse cursor never drifts.
        </p>
      </div>
    `,
    telemetry: `
<span class="ast-highlight">// Native Desktop Bridge Telemetry</span>
[TaskSpace: 0] Mode: Direct User Viewport
[Isolation] Process: Shared Chromium Engine
[Session] Cookies: Primary Chrome Profile
[State] Mouse Hijack Prevention: <span class="prob-score">STRICT_ACTIVE</span>
[Status] Background agents: 2 isolated spaces running concurrently
    `
  },
  'agent-1': {
    status: 'Background Task Space #1 • Running',
    meta: 'Agent: Claude Code • Task: Lead Enrichment',
    previewHtml: `
      <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; border: 1px solid var(--border-glass);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-cyan);">URL: https://linkedin.com/in/ai-lead-1092</span>
          <span style="font-size: 0.75rem; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 4px;">Snapshot Cleaned</span>
        </div>
        <div style="border-left: 3px solid var(--accent-cyan); padding-left: 12px; font-size: 0.85rem; color: #cbd5e1;">
          <div><code class="ast-highlight">[@e1]</code> <strong>VP of Engineering</strong> at ScaleOps</div>
          <div><code class="ast-highlight">[@e2]</code> <button style="background: #2563eb; color: #fff; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Connect</button> (Decision Score: 96.4%)</div>
          <div><code class="ast-highlight">[@e3]</code> Experience: 12 yrs in Distributed Infrastructure</div>
        </div>
      </div>
    `,
    telemetry: `
<span class="ast-highlight">[Jev Compiler] AST Filtering Complete (0.42ms)</span>
Raw DOM Elements: 1,842 -> Cleaned Choice Criteria: 8 elements
Action Space: [
  { ref: "@e2", kind: "click", text: "Connect", prob: <span class="prob-score">0.964</span> },
  { ref: "@e4", kind: "click", text: "More actions", prob: <span class="prob-score">0.021</span> }
]
Jev Decision: Execute in-page JS: <span class="ast-highlight">document.querySelector('[data-ref="@e2"]').click()</span>
Tokens Consumed: 142 tokens (vs 1,280 standard CLI)
    `
  },
  'agent-2': {
    status: 'Background Task Space #2 • Running',
    meta: 'Agent: Codex CLI • Task: Price Scraping',
    previewHtml: `
      <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; border: 1px solid var(--border-glass);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-cyan);">URL: https://cloudprovider.com/pricing</span>
          <span style="font-size: 0.75rem; background: rgba(99,102,241,0.15); color: #818cf8; padding: 2px 8px; border-radius: 4px;">Table Extracted</span>
        </div>
        <div style="font-size: 0.82rem; color: #e2e8f0; font-family: var(--font-mono);">
          <div>Tier: Enterprise Cluster (48 vCPU, 192GB RAM) -> $1.84/hr</div>
          <div>Tier: High-Memory Node (16 vCPU, 128GB RAM) -> $0.92/hr</div>
          <div>Status: Exported JSON to <code class="ast-highlight">./pricing-matrix.json</code></div>
        </div>
      </div>
    `,
    telemetry: `
<span class="ast-highlight">[Jev Compiler] Table Parser Active</span>
Target Table Ref: [@t1] (Deeply nested inside cross-origin iframe)
Iframe Traversal: Resolved via Jev Native Shadow Bridge
Extraction Speed: 18ms (Batch JS evaluate)
Execution Status: <span class="prob-score">SUCCESS (0 retries)</span>
Memory Overhead: 24MB isolated partition
    `
  }
};

function initSpacesSimulator() {
  const tabs = document.querySelectorAll('.space-tab');
  const statusBadge = document.getElementById('space-pane-status');
  const metaBadge = document.getElementById('space-pane-meta');
  const previewBody = document.getElementById('space-preview-body');
  const telemetryBody = document.getElementById('space-telemetry-body');

  if (!tabs.length || !previewBody || !telemetryBody) return;

  function renderSpace(spaceId) {
    const data = SPACES_DATA[spaceId] || SPACES_DATA['user'];
    if (statusBadge) statusBadge.textContent = data.status;
    if (metaBadge) metaBadge.textContent = data.meta;
    previewBody.innerHTML = data.previewHtml;
    telemetryBody.innerHTML = data.telemetry.trim();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const spaceKey = tab.getAttribute('data-space');
      renderSpace(spaceKey);
    });
  });

  // Initial render
  renderSpace('user');
}

/* ==========================================================================
   3. Install Snippet Tabs & Copy Functionality
   ========================================================================== */
const INSTALL_SNIPPETS = {
  'mac': {
    code: 'curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash',
    tip: 'Installs native runtime, Chromium binaries, and auto-configures Claude Code, Codex, Hermes, and OpenClaw.'
  },
  'npx': {
    code: 'npx skills add digitalfoudnry-vb/jev-browser',
    tip: 'Installs the official Jev Browser skill into your agent workspace without touching global files.'
  },
  'agent': {
    code: 'Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser Read skills/jev-browser/references/setup.md and install it.',
    tip: 'Paste directly into Claude Code, Codex, Cursor, or Hermes to let your agent perform automated onboarding.'
  }
};

function initInstallTabs() {
  const tabs = document.querySelectorAll('#install-tabs .space-tab');
  const codeEl = document.getElementById('install-command-text');
  const tipEl = document.getElementById('install-tip-text');

  if (!tabs.length || !codeEl) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-install');
      const item = INSTALL_SNIPPETS[key] || INSTALL_SNIPPETS['mac'];
      codeEl.textContent = item.code;
      if (tipEl) tipEl.textContent = item.tip;
    });
  });
}

function copyInstallSnippet() {
  const codeEl = document.getElementById('install-command-text');
  const btn = document.getElementById('install-copy-btn');
  if (!codeEl || !btn) return;

  navigator.clipboard.writeText(codeEl.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.borderColor = 'var(--accent-cyan)';
    btn.style.color = 'var(--accent-cyan)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  });
}

function copyNpxCommand() {
  const text = 'npx skills add digitalfoudnry-vb/jev-browser';
  const label = document.getElementById('npx-label');
  navigator.clipboard.writeText(text).then(() => {
    if (label) {
      const orig = label.textContent;
      label.textContent = 'Copied to Clipboard!';
      setTimeout(() => {
        label.textContent = orig;
      }, 2000);
    }
  });
}
