<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *Самый быстрый браузер для автономных ИИ-агентов*

Разработано в **[digitalfoundry.ai](https://digitalfoundry.ai/)**

---

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Português](README.pt.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Русский**

</div>

---

**Jev Browser** — это браузер, в котором вы и ваши ИИ-агенты работаете параллельно. Ваши агенты выполняют задачи в собственных изолированных пространствах (Spaces) внутри того же браузера, пока вы продолжаете пользоваться своими вкладками. Агент никогда не перехватывает курсор или фокус окна, а автоматизация завершается быстрее и с меньшими затратами токенов.

Существующие инструменты (такие как browser-use или agent-browser) являются лишь внешними мостами к стороннему браузеру: данные сессий редко переносятся корректно, подключение нестабильно, а агент борется с пользователем за контроль над экраном. Jev Browser изначально спроектирован для беспрепятственного совместного использования.

---

## Демо (Demo)

<div align="center">

[![Смотреть демо Jev Browser](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[Смотреть официальное 20-секундное видео (MP4)](brag-output/brag.mp4)** — Автономные параллельные пространства задач на базе Jev Decision Intelligence*

</div>

---

## Быстрый старт (Quick Start)

Jev Browser работает на macOS, закрытая бета-версия для Windows появится в ближайшее время, а Linux находится в планах разработки.

### 1. Установка

```bash
# Установка одной командой для macOS
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

Установка только навыка через npx:
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

Или поручите настройку вашему агенту:
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

---

## Сравнение возможностей

| Функция | Jev Browser | Browser-Use | agent-browser (Vercel) | ChatGPT Atlas | Perplexity Comet |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Параллельная многозадачность** | **✓** | — | — | — | — |
| **Многоразовые навыки (Skills)** | **✓** | — | — | — | — |
| **Импорт данных Chrome** | **✓** | — | — | ✓ | ✓ |
| **Изолированные пространства Spaces** | **✓** | — | — | — | — |
| **Сжатый семантический снимок** | **✓** | — | ✓ | — | — |
| **Управление внешними агентами** | **✓** | ✓ | ✓ | — | — |
| **Бесплатный и с открытым кодом** | **✓** | ✓ | ✓ | — | — |

---

## Лицензия (License)

Лицензия MIT — см. [LICENSE](LICENSE) и [NOTICE](NOTICE.md).
Создано с гордостью в **[digitalfoundry.ai](https://digitalfoundry.ai/)**.
