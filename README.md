# 🎬 CineVibe

> Descubra o que assistir com Inteligência Artificial

CineVibe é um PWA (Progressive Web App) para descoberta de filmes e séries com IA, integração com TMDB e Watchmode, e informações de onde assistir em todos os streamings.

---

## ✨ Funcionalidades

- 🤖 **IA Indica** – Recomendações por humor usando Claude AI
- 🎬 **Catálogo completo** – Filmes e séries via TMDB
- 📺 **Onde assistir** – Netflix, Disney+, Prime, HBO Max e mais (TMDB + Watchmode)
- 🔥 **Em Alta** – Trending diário e semanal
- ❤️ **Favoritos** – Salvo localmente no dispositivo
- 📌 **Quero Ver** – Lista de watchlist
- 👤 **Biografias de atores** – Com filmografia e fotos
- 🔍 **Busca global** – Filmes, séries e pessoas
- 📡 **Streamings** – Catálogo por plataforma
- 📲 **PWA** – Instala como app no celular

---

## 🛠 Tecnologias

- HTML5 + CSS3 + JavaScript (Vanilla)
- TMDB API v3
- Watchmode API
- Anthropic Claude API (IA de recomendação)
- Service Worker (PWA offline)

---

## 🚀 Deploy no Vercel

1. Crie um repositório no GitHub e faça upload destes arquivos
2. Acesse [vercel.com](https://vercel.com) e conecte o repositório
3. Deploy automático — o `vercel.json` já cuida dos headers e cache

> ⚠️ O `vercel.json` inclui configuração para:
> - Evitar cache antigo do Service Worker
> - Cache longo para assets estáticos (JS/CSS)
> - Rewrite para SPA (single page app)

---

## 📁 Estrutura de Arquivos

```
cinevibe/
├── index.html              # Entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── vercel.json             # Deploy config (Vercel)
├── css/
│   ├── reset.css           # CSS reset
│   ├── variables.css       # Design tokens / cores
│   ├── app.css             # Layout principal
│   ├── components.css      # Componentes (cards, chips, etc)
│   └── animations.css      # Animações
├── js/
│   ├── config.js           # API keys e constantes
│   ├── api.js              # Todas as chamadas API
│   ├── store.js            # Estado local (favoritos, watchlist)
│   ├── router.js           # Roteamento SPA
│   ├── ui.js               # Helpers de interface
│   ├── app.js              # Bootstrap do app
│   ├── sw-register.js      # Registro do SW
│   └── pages/
│       ├── home.js         # Página inicial
│       ├── movies.js       # Catálogo de filmes
│       ├── series.js       # Catálogo de séries
│       ├── trending.js     # Em alta
│       ├── aiPick.js       # IA Indica
│       ├── streamings.js   # Por plataforma
│       ├── favorites.js    # Favoritos + Watchlist
│       ├── watchlist.js    # (importado via favorites.js)
│       └── detail.js       # Modal de detalhes
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon.svg
```

---

## 🔑 APIs Utilizadas

| API | Uso |
|-----|-----|
| `TMDB` | Catálogo, detalhes, elenco, trailers, where to watch |
| `Watchmode` | Fontes de streaming adicionais |
| `Anthropic Claude` | Texto de recomendação por humor |

---

## 🎨 Design

- **Paleta**: Deep space — `#080810` bg, `#00e5c8` accent (teal elétrico), `#a855f7` AI (roxo)
- **Tipografia**: Bebas Neue (display) + DM Sans (corpo) + DM Mono (mono)
- **Tema**: 100% escuro, cinematográfico

---

## 📝 Personalização

Edite `/js/config.js` para trocar API keys ou ajustar streamings destacados.
