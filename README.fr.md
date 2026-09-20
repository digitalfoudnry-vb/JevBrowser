<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *Le navigateur le plus rapide permettant aux agents IA d'exécuter l'automatisation Web*

Créé par **[digitalfoundry.ai](https://digitalfoundry.ai/)**

---

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Português](README.pt.md) · [Español](README.es.md) · **Français** · [Italiano](README.it.md) · [Русский](README.ru.md)

</div>

---

**Jev Browser** est un navigateur où vous et vos agents IA travaillez en parallèle. Vos agents exécutent leurs tâches dans leurs propres Spaces, des espaces de travail isolés au sein du même navigateur, tandis que vous continuez à naviguer sans interruption. Vos onglets et votre souris restent sous votre contrôle total.

Les outils existants (tels que browser-use ou agent-browser) ne sont que des passerelles externes vers un navigateur séparé : données mal synchronisées, connexions instables et conflits de contrôle fréquents. Jev Browser est conçu dès le départ pour être partagé en toute sécurité.

---

## Démo (Demo)

<div align="center">

[![Regarder la démo de Jev Browser](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[Regarder la vidéo officielle de lancement (20s MP4)](brag-output/brag.mp4)** — Espaces de tâches parallèles autonomes propulsés par l'intelligence décisionnelle Jev*

</div>

---

## Démarrage Rapide (Quick Start)

Jev Browser fonctionne sur macOS aujourd'hui, bêta fermée Windows très prochainement, et Linux sur la feuille de route.

### 1. Installation

```bash
# Installation en une seule commande pour macOS
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

Ajoutez la compétence via npx :
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

Ou laissez votre agent le configurer :
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

---

## Comparatif des fonctionnalités

| Fonctionnalité | Jev Browser | Browser-Use | agent-browser (Vercel) | ChatGPT Atlas | Perplexity Comet |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Multitâche en parallèle** | **✓** | — | — | — | — |
| **Compétences réutilisables** | **✓** | — | — | — | — |
| **Héritage des données Chrome** | **✓** | — | — | ✓ | ✓ |
| **Espaces de travail isolés** | **✓** | — | — | — | — |
| **Entrée sémantique compressée** | **✓** | — | ✓ | — | — |
| **Pilotable par agents externes** | **✓** | ✓ | ✓ | — | — |
| **Gratuit et Open Source** | **✓** | ✓ | ✓ | — | — |

---

## Licence (License)

Licence MIT — voir [LICENSE](LICENSE) et [NOTICE](NOTICE.md).
Créé avec fierté par **[digitalfoundry.ai](https://digitalfoundry.ai/)**.
