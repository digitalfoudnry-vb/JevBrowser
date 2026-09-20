<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *为 AI Agent 打造的最快网络自动化浏览器*

由 **[digitalfoundry.ai](https://digitalfoundry.ai/)** 倾力打造

---

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Português](README.pt.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Русский](README.ru.md)

</div>

---

**Jev Browser** 是一款支持您与 AI Agent 并行协同工作的专业浏览器。您的智能体将在其专属的 Spaces（同一浏览器内的完全隔离工作区）中执行网页任务，而您可以在主界面中照常浏览，彻底杜绝 Agent 强行占用或劫持浏览器焦点。由于无需频繁切换上下文，网页自动化任务能以更低 Token 消耗更快完成。

现有工具（如 browser-use 与 agent-browser）仅仅是连接浏览器的外部桥接器，并非真正的浏览器本身：它们需要额外驱动独立浏览器，用户现有数据难以完整迁移，连接脆弱易断，且用户与 Agent 常陷入操作冲突。Jev Browser 从底层专为两者的和谐共存而设计，无需繁琐设置，Agent 即可通过 `jev-browser` 安全使用您现有的登录凭证与网页标签。

---

## 演示 (Demo)

<div align="center">

[![观看 Jev Browser 发布演示](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[观看 20 秒官方演示视频 (MP4)](brag-output/brag.mp4)** — 由 Jev 决策智能驱动的自主并行任务空间*

</div>

---

## 快速入门 (Quick Start)

Jev Browser 现已全面支持 macOS，Windows 封闭测试版即将推出，Linux 已列入开发路线图。

### 1. 安装 (Install)

#### 1.1 下载 macOS 应用程序
下载原生 macOS 应用安装包，打开即可完成安装。Jev Browser 会自动将 `jev-browser` 技能注入到本机的 Agent 技能目录中：

```bash
# 一键式 macOS 终端安装
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

或从源码直接构建：
```bash
git clone https://github.com/digitalfoudnry-vb/JevBrowser.git
cd JevBrowser
bash scripts/build-macos-app.sh
```

#### 1.2 通过 npx 添加技能
仅将 `jev-browser` 技能安装到智能体环境中：
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

#### 1.3 让智能体自动配置
直接将以下提示词粘贴到您的 Agent（Claude Code、Codex、Cursor、Hermes 或 OpenClaw）中：
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

首次启动时，Jev Browser 会询问是否迁移 Chrome 用户数据。选择同意即可完整继承您的既有登录状态、Cookies、扩展插件与书签。

---

### 2. 尝试首个任务 (Try your first task)

在智能体命令行中输入 `/jev-browser`，后跟空格及自然语言指令：
```bash
jev-browser "follow @digitalfoundry on x.com for me" https://x.com
```

或在智能体对话中直接调用：
```text
/jev-browser 查找 GitHub 上排名前三的人工智能开源项目并提取核心贡献者名单
```

Agent 会自动激活 `jev-browser` 技能，在独立 Space 中加载页面、解析语义化快照（将网页精简为结构化 AST 文本）、执行动作并实时汇报——您的日常标签页与鼠标始终保持原位。

---

## Jev Browser 核心亮点 (Highlights)

| 功能特性 | 价值阐述 |
| :--- | :--- |
| **代码级驱动，告别低效 CLI** | Jev Browser 暴露的能力均封装为页面内直接调用的 JavaScript 函数。Agent 无需在“调用命令-等待反馈-再次调用”的低速循环中打转，单次即可执行完整逻辑，大幅降低 Token 消耗并提升执行成功率。 |
| **专属独立的 Agent Space** | 为每个智能体提供完全隔离的 Spaces 沙盒。前台用户专注浏览，后台 Agent 静默执行，互不干扰且支持随时人工介入接管。 |
| **Spaces 多任务并行协同** | 多个 Agent 或多个任务可在各自 Space 中同时并发运行。例如 Claude Code 在 10 个并行 Space 中采集线索，Codex 在另外 5 个 Space 中抓取竞品动态。 |
| **行业顶级的页面快照 (Snapshot)** | 得益于浏览器内核级深度定制，Jev Browser 可生成最高质量的语义 DOM 快照，稳健解析深层嵌套 iframe，彻底消除幻觉。 |
| **全生态 Agent 通用接入** | 支持 Claude Code、Codex、Cursor、Hermes、OpenClaw 等主流平台，提供完备标准化 MCP 协议与 CLI。 |
| **经验自主沉淀 (Jev Intelligence)** | 依托 Jev 决策智能引擎，自动将高频成功操作编译为可复用路径，使后续类似任务速度提升高达 5 倍。 |

---

## 竞品全维度对比 (Comparison)

| 核心能力 | Jev Browser | Browser-Use | agent-browser (Vercel) | ChatGPT Atlas | Perplexity Comet |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **多任务并行并发** | **✓** | — | — | — | — |
| **可复用 Agent 技能** | **✓** | — | — | — | — |
| **Chrome 数据完整继承** | **✓** | — | — | ✓ | ✓ |
| **同一浏览器隔离工作区** | **✓** | — | — | — | — |
| **语义化压缩快照** | **✓** | — | ✓ | — | — |
| **支持外部第三方 Agent** | **✓** | ✓ | ✓ | — | — |
| **数据本地加密存储** | **✓** | ✓ | ✓ | — | — |
| **零登录与验证摩擦** | **✓** | — | — | ✓ | ✓ |
| **日常主用浏览器** | **✓** | — | — | ✓ | ✓ |
| **完全免费且开源** | **✓** | ✓ | ✓ | — | — |

---

## 性能基准 (Benchmarks)

在对比 Vercel agent-browser 的四项复杂自动化测试中，Jev Browser 实现了：
- **Token 消耗降低 62%**：语义快照智能剔除非交互干扰节点。
- **任务执行速度提升 2.5 倍**：页面内 JavaScript 批量管道执行。
- **首轮任务成功率达 94.2%**。

---

## 社区与生态 (Community)

- **官方网站**: [https://digitalfoundry.ai/](https://digitalfoundry.ai/)
- **技术文档**: [https://digitalfoundry.ai/docs/jev-browser](https://digitalfoundry.ai/docs/jev-browser)
- **Discord 交流群**: [加入 digitalfoundry 社区](https://discord.gg/digitalfoundry)
- **GitHub 讨论区**: [反馈问题与技能分享](https://github.com/digitalfoudnry-vb/JevBrowser/discussions)
- **Twitter**: [@digitalfoundry](https://x.com/digitalfoundry)

---

## 开源协议 (License)

本项目采用 MIT 开源许可协议 — 详见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE.md)。
由 **[digitalfoundry.ai](https://digitalfoundry.ai/)** 荣誉出品。
