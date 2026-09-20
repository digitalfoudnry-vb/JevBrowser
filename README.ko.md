<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *AI 에이전트를 위한 가장 빠른 웹 자동화 브라우저*

제작: **[digitalfoundry.ai](https://digitalfoundry.ai/)**

---

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어** · [Português](README.pt.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Русский](README.ru.md)

</div>

---

**Jev Browser**는 사용자와 AI 에이전트가 동시에 병렬로 작업할 수 있는 브라우저입니다. 에이전트는 동일한 브라우저 내의 완전히 격리된 작업 공간인 'Spaces'에서 작업을 수행하므로, 사용자의 활성 탭이나 마우스 커서를 방해하지 않습니다.

기존 도구(Browser-Use, agent-browser 등)는 브라우저를 제어하는 외부 브리지에 불과하며 자체 브라우저가 아닙니다. 브라우저 데이터 동기화가 불안정하고 사용자와 에이전트가 제어권을 두고 충돌하기 쉽습니다. Jev Browser는 처음부터 공유 브라우징을 위해 설계되어, `jev-browser`를 통해 실제 로그인 정보와 탭에 안전하게 접근할 수 있습니다.

---

## 데모 (Demo)

<div align="center">

[![Jev Browser 런칭 데모 시청](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[20초 런칭 데모 비디오 시청 (MP4)](brag-output/brag.mp4)** — Jev 의사결정 인텔리전스 기반의 자율 병렬 작업 공간*

</div>

---

## 빠른 시작 (Quick Start)

Jev Browser는 macOS를 완벽히 지원하며, Windows 비공개 베타가 곧 출시될 예정이고 Linux는 로드맵에 포함되어 있습니다.

### 1. 설치 (Install)

#### 1.1 macOS 앱 다운로드
macOS 네이티브 앱을 다운로드하여 설치하십시오. 시스템의 에이전트 스킬 디렉토리에 `jev-browser` 스킬이 자동으로 등록됩니다:

```bash
# 원클릭 macOS 터미널 설치 스크립트
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

또는 소스에서 직접 빌드:
```bash
git clone https://github.com/digitalfoudnry-vb/JevBrowser.git
cd JevBrowser
bash scripts/build-macos-app.sh
```

#### 1.2 npx로 스킬 추가
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

#### 1.3 에이전트 자동 설정
Claude Code, Codex, Cursor, Hermes, OpenClaw에 아래 프롬프트를 입력하십시오:
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

첫 실행 시 Chrome 데이터 마이그레이션 안내가 표시됩니다. 승인하면 기존 로그인 세션, 쿠키, 확장 프로그램 및 북마크가 안전하게 동기화됩니다.

---

### 2. 첫 작업 실행하기

```bash
jev-browser "follow @digitalfoundry on x.com for me" https://x.com
```

또는 에이전트 CLI에서:
```text
/jev-browser 깃허브에서 인공지능 트렌드 상위 3개 저장소를 찾고 주요 기여자를 정리해줘
```

---

## Jev Browser 핵심 특징 (Highlights)

- **코드 기반의 초고속 실행**: 브라우저 내에서 직접 실행되는 JavaScript 함수로 복잡한 다단계 작업을 한 번에 처리하여 토큰 비용을 최소화합니다.
- **모든 에이전트를 위한 전용 Spaces**: 완벽히 격리된 백그라운드 작업 공간을 제공합니다.
- **다중 에이전트 병렬 멀티태스킹**: 여러 에이전트가 충돌 없이 동시에 대규모 웹 자동화 작업을 처리합니다.
- **업계 최고의 페이지 스냅샷 (Snapshot)**: 깊은 iframe 구조까지 정확하게 캡처하는 지능형 시맨틱 스냅샷.
- **경험 누적 가속 (Jev Intelligence)**: 성공적인 탐색 경로를 스스로 학습하여 후속 작업 속도를 최대 5배 향상시킵니다.

---

## 제품 비교 (Comparison)

| 기능 | Jev Browser | Browser-Use | agent-browser (Vercel) | ChatGPT Atlas | Perplexity Comet |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **병렬 멀티태스킹** | **✓** | — | — | — | — |
| **재사용 가능한 스킬** | **✓** | — | — | — | — |
| **Chrome 데이터 계승** | **✓** | — | — | ✓ | ✓ |
| **격리된 독립 작업 공간** | **✓** | — | — | — | — |
| **외부 에이전트 완벽 지원** | **✓** | ✓ | ✓ | — | — |
| **로컬 안전 저장** | **✓** | ✓ | ✓ | — | — |
| **무료 오픈소스** | **✓** | ✓ | ✓ | — | — |

---

## 라이선스 (License)

MIT License — 자세한 사항은 [LICENSE](LICENSE)를 참조하십시오.
제작: **[digitalfoundry.ai](https://digitalfoundry.ai/)**.
