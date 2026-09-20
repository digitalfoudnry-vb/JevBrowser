<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *AI エージェント向けに設計された最速の Web 自動化ブラウザ*

開発元: **[digitalfoundry.ai](https://digitalfoundry.ai/)**

---

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md) · [Português](README.pt.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Русский](README.ru.md)

</div>

---

**Jev Browser** は、あなたと AI エージェントが並行して快適に作業できるように設計された専用ブラウザです。エージェントはブラウザ内の完全に独立した作業スペース「Spaces」でタスクを実行するため、あなたの作業中のタブやマウス操作が奪われることは一切ありません。

既存のツール（Browser-Use や agent-browser など）はブラウザを操作するための外部ブリッジに過ぎず、独立したブラウザ自体ではありません。既存データの同期が難しく、接続が不安定で、ユーザーとエージェント間で操作の衝突が発生しがちです。Jev Browser は最初から共同利用を前提に設計されており、`jev-browser` 経由で既存のログイン情報やタブをスムーズに共有できます。

---

## デモ (Demo)

<div align="center">

[![Jev Browser ローンチデモを視聴](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[20秒のローンチデモ動画を見る (MP4)](brag-output/brag.mp4)** — Jev 意思決定知能による自律的並行タスクスペース*

</div>

---

## クイックスタート (Quick Start)

Jev Browser は現在 macOS に完全対応しています。Windows クローズドベータは近日提供予定、Linux はロードマップに掲載されています。

### 1. インストール (Install)

#### 1.1 macOS アプリのダウンロード
macOS ネイティブアプリをダウンロードしてインストールしてください。Jev Browser はシステム上の各エージェントディレクトリに `jev-browser` スキルを自動登録します:

```bash
# ワンライナー macOS インストーラー
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

またはソースコードからビルド:
```bash
git clone https://github.com/digitalfoudnry-vb/JevBrowser.git
cd JevBrowser
bash scripts/build-macos-app.sh
```

#### 1.2 npx でスキルを追加
エージェントにスキルのみを追加する場合:
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

#### 1.3 エージェントに自動セットアップさせる
Claude Code、Codex、Cursor、Hermes、OpenClaw に以下のプロンプトを入力してください:
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

初回起動時に Chrome データの移行確認画面が表示されます。「はい」を選択すると、既存のログイン情報、クッキー、拡張機能、ブックマークが引き継がれます。

---

### 2. 最初のタスクを実行する

エージェントの CLI で `/jev-browser` に続けてタスクを自然言語で指定します:
```bash
jev-browser "follow @digitalfoundry on x.com for me" https://x.com
```

または対話画面から直接実行:
```text
/jev-browser GitHubで人工知能のトレンドリポジトリ上位3件を調査し主要コントリビューターを抽出して
```

---

## Jev Browser の主な特長 (Highlights)

| 機能 | 概要 |
| :--- | :--- |
| **CLI ではなくコードベースの超高速実行** | Jev Browser の各機能はページ内で実行可能な JavaScript 関数として提供されます。エージェントは複数ステップのコードを一度に書き込んで実行できるため、トークン消費を最小限に抑えつつ大幅に高速化します。 |
| **各エージェント専用の独立 Space** | エージェントごとに完全に隔離された Spaces を割り当てます。あなたのブラウジングを妨げることなくバックグラウンドで安全に動作します。 |
| **マルチタスクの並行処理** | 複数のエージェントが異なる Space で同時並行でタスクをこなします。Claude Code が10件のリード調査を行い、同時に Codex が5件の競合分析を実行可能です。 |
| **最高精度のページスナップショット (Snapshot)** | 独自のブラウザエンジン最適化により、多重構造の iframe も正確に把握できる高精度なセマンティクススナップショットを生成します。 |
| **あらゆるエージェントに対応** | Claude Code、Codex、Cursor、Hermes、OpenClaw など、標準的な MCP プロトコルと CLI で即座に連携可能です。 |
| **タスク経験の自動蓄積 (Jev Intelligence)** | 成功した操作パターンを Jev 意思決定エンジンが自動学習し、次回以降の類似タスクを最大5倍高速化します。 |

---

## 既存製品との比較 (Comparison)

| 機能 / 特徴 | Jev Browser | Browser-Use | agent-browser (Vercel) | ChatGPT Atlas | Perplexity Comet |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **並行マルチタスク** | **✓** | — | — | — | — |
| **再利用可能なスキル** | **✓** | — | — | — | — |
| **Chrome データ引き継ぎ** | **✓** | — | — | ✓ | ✓ |
| **同一ブラウザ内の独立空間** | **✓** | — | — | — | — |
| **圧縮セマンティクス入力** | **✓** | — | ✓ | — | — |
| **外部エージェントからの制御** | **✓** | ✓ | ✓ | — | — |
| **データのローカル安全保存** | **✓** | ✓ | ✓ | — | — |
| **ログインの摩擦ゼロ** | **✓** | — | — | ✓ | ✓ |
| **日常利用ブラウザとして共有** | **✓** | — | — | ✓ | ✓ |
| **完全無料＆オープンソース** | **✓** | ✓ | ✓ | — | — |

---

## ベンチマーク結果 (Benchmarks)

Vercel の agent-browser との比較検証において、Jev Browser は以下の実績を達成しました:
- **トークン消費量を 62% 削減**
- **実行時間を最大 2.5 倍高速化**
- **初巡タスク成功率 94.2%**

---

## コミュニティ & リンク

- **公式サイト**: [https://digitalfoundry.ai/](https://digitalfoundry.ai/)
- **ドキュメント**: [https://digitalfoundry.ai/docs/jev-browser](https://digitalfoundry.ai/docs/jev-browser)
- **Discord**: [digitalfoundry コミュニティに参加](https://discord.gg/digitalfoundry)
- **X (Twitter)**: [@digitalfoundry](https://x.com/digitalfoundry)

---

## ライセンス (License)

本プロジェクトは MIT ライセンスの下で公開されています — 詳細は [LICENSE](LICENSE) および [NOTICE](NOTICE.md) をご覧ください。
開発元: **[digitalfoundry.ai](https://digitalfoundry.ai/)**
