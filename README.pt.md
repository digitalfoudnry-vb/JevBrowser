<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser

### *O navegador mais rápido para agentes de IA executarem automação web*

Criado por **[digitalfoundry.ai](https://digitalfoundry.ai/)**

---

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Português** · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Русский](README.ru.md)

</div>

---

**Jev Browser** é um navegador onde você e seus agentes de IA trabalham em paralelo. Seus agentes executam tarefas em seus próprios Spaces, áreas de trabalho isoladas dentro do mesmo navegador, enquanto você continua navegando normalmente, sem nunca perder o controle da tela ou do mouse. E a automação termina muito mais rápido, com menos consumo de tokens.

Ferramentas existentes como browser-use e agent-browser são apenas pontes externas para o navegador: exigem uma instância separada, dados raramente são transferidos com precisão, a conexão oscila e você e o agente disputam o foco da tela. O Jev Browser foi projetado desde o primeiro dia para ser compartilhado, permitindo que seus agentes acessem seus logins e abas reais com total estabilidade.

---

## Demonstração (Demo)

<div align="center">

[![Assistir à demonstração do Jev Browser](brag-output/brag.jpg)](brag-output/brag.mp4)

*🎬 **[Assistir ao vídeo de lançamento de 20s (MP4)](brag-output/brag.mp4)** — Espaços de Tarefas Paralelos Autônomos com Inteligência de Decisão Jev*

</div>

---

## Início Rápido (Quick Start)

O Jev Browser roda no macOS hoje, beta fechado para Windows em breve, e Linux no roadmap.

### 1. Instalação

```bash
# Instalador em uma linha para macOS
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

Ou adicione a skill via npx:
```bash
npx skills add digitalfoudnry-vb/jev-browser
```

Ou deixe seu agente configurar:
```text
Set up Jev Browser for me: https://github.com/digitalfoudnry-vb/JevBrowser
Read `skills/jev-browser/references/setup.md` and follow the steps to install Jev Browser.
```

No primeiro lançamento, o Jev Browser pergunta se deseja migrar seus dados do Chrome para herdar cookies, logins e favoritos.

---

### 2. Execute sua primeira tarefa

No terminal do seu agente:
```bash
jev-browser "follow @digitalfoundry on x.com for me" https://x.com
```

---

## Comparativo de Recursos

| Recurso | Jev Browser | Browser-Use | agent-browser (Vercel) | ChatGPT Atlas | Perplexity Comet |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Multitarefa paralela** | **✓** | — | — | — | — |
| **Skills reutilizáveis** | **✓** | — | — | — | — |
| **Herança de dados do Chrome** | **✓** | — | — | ✓ | ✓ |
| **Espaço de trabalho isolado** | **✓** | — | — | — | — |
| **Entrada semântica compacta** | **✓** | — | ✓ | — | — |
| **Controle por agentes externos** | **✓** | ✓ | ✓ | — | — |
| **Gratuito e Open Source** | **✓** | ✓ | ✓ | — | — |

---

## Licença (License)

Licença MIT — consulte [LICENSE](LICENSE) e [NOTICE](NOTICE.md).
Criado com orgulho por **[digitalfoundry.ai](https://digitalfoundry.ai/)**.
