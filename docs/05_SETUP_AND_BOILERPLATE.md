# Owlbear Rodeo 2.0 — Guia de Setup, Boilerplate e Publicação

Este documento fornece a estrutura de arquivos completa e passo a passo para criar e publicar uma extensão profissional para o Owlbear Rodeo.

---

## 1. Estrutura Padrão de Diretórios

```text
meu-projeto-owlbear/
├── public/
│   ├── icon.svg             # Ícone para a barra de ação (action bar)
│   ├── logo.png             # Logo da extensão no catálogo (ex: 128x128)
│   └── manifest.json        # Arquivo de manifesto do Owlbear Rodeo
├── src/
│   ├── background.ts        # Script de fundo (se houver contextMenu ou tools)
│   ├── main.ts              # Script da interface do popover (Action)
│   ├── style.css            # Estilização
│   └── vite-env.d.ts        # Tipagens do Vite
├── background.html          # HTML do script de fundo
├── index.html               # HTML do popover / tela principal
├── package.json             # Dependências e scripts
├── tsconfig.json            # Configuração do TypeScript
└── vite.config.ts           # Configuração do empacotador Vite
```

---

## 2. Arquivos de Configuração

### `package.json`
```json
{
  "name": "meu-projeto-owlbear",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@owlbear-rodeo/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### `vite.config.ts`
> [!IMPORTANT]
> **Multi-Page App:** Como a extensão pode ter `index.html` (para o popover) e `background.html` (para o script de fundo), precisamos configurar o Rollup para compilar ambas as páginas, e definir `base: "./"` para permitir caminhos relativos em qualquer domínio ou subdiretório (como GitHub Pages).

```typescript
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "background.html")
      }
    }
  },
  server: {
    cors: true,
    port: 5173
  }
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "moduleResolution": "Node",
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### `src/vite-env.d.ts`
```typescript
/// <reference types="vite/client" />
```

---

## 3. Páginas HTML e Manifesto

### `public/manifest.json`
```json
{
  "name": "Minha Extensão Incrível",
  "version": "1.0.0",
  "manifest_version": 1,
  "author": "Meu Nome",
  "icon": "/logo.png",
  "description": "Extensão para auxiliar combates e interação com tokens.",
  "action": {
    "title": "Minha Extensão",
    "icon": "/icon.svg",
    "popover": "/",
    "width": 320,
    "height": 450
  },
  "background_url": "/background.html"
}
```

### `index.html` (Interface do Popover)
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Minha Extensão</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app">
      <h1>Carregando...</h1>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### `background.html` (Script Oculto)
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Background Service</title>
  </head>
  <body>
    <script type="module" src="/src/background.ts"></script>
  </body>
</html>
```

---

## 4. Passo a Passo: Desenvolvimento Local

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor Vite:
   ```bash
   npm run dev
   ```
   O terminal informará a URL local, normalmente: `http://localhost:5173`.
3. Abra o [Owlbear Rodeo](https://owlbear.app/) no navegador.
4. Clique no seu **Perfil** (canto inferior esquerdo) > **Extensions** > botão **`+` (Add Custom Extension)**.
5. Digite ou cole a URL:
   ```text
   http://localhost:5173/manifest.json
   ```
6. O Owlbear lerá o manifest e adicionará a extensão à sua conta.
7. Abra qualquer sala, abra o menu de configurações da sala (ícone de 3 pontos `...` no canto inferior esquerdo), selecione **Extensions** e ative a sua extensão.
8. Pronto! Qualquer alteração no seu código será recarregada automaticamente (Hot Module Replacement - HMR).

---

## 5. Publicação em Produção

Para disponibilizar sua extensão para outros mestres e jogadores:

### A. Vercel / Netlify / Cloudflare Pages
1. Suba o código para um repositório no GitHub.
2. Conecte ao Vercel/Netlify/Cloudflare Pages.
3. Configure:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Após o deploy, sua extensão terá uma URL HTTPS (ex: `https://minha-extensao.vercel.app`).
5. A URL de instalação compartilhável será:
   ```text
   https://minha-extensao.vercel.app/manifest.json
   ```

### B. GitHub Pages
1. No `vite.config.ts`, defina `base: "/nome-do-repositorio/"` (se não for domínio próprio) ou `base: "./"`.
2. Configure o GitHub Actions para compilar e publicar a pasta `dist` na branch `gh-pages`.
3. A URL de instalação será `https://usuario.github.io/nome-do-repositorio/manifest.json`.

---

## 6. Checklist de Solução de Problemas Comuns

| Erro / Sintoma | Causa Mais Frequente | Solução |
| :--- | :--- | :--- |
| **"Failed to load manifest"** no Owlbear | Servidor local não está rodando ou cabeçalhos de CORS bloqueados. | Verifique se `npm run dev` está ativo e se a URL termina com `/manifest.json`. |
| **Tela branca no popover** | Falha de importação ou execução antes de `OBR.onReady`. | Envolva todo o código executável dentro de `OBR.onReady(async () => { ... })`. |
| **`OBR.scene.items` retorna array vazio** | Nenhuma cena (mapa) foi aberta na sala ainda. | Use `const ready = await OBR.scene.isReady()` e monitore `OBR.scene.onReadyChange()`. |
| **Anéis/auras interceptam cliques do mouse** | O item filho não possui `disableHit: true`. | Defina `.disableHit(true)` no builder do item para que o clique selecione o token pai. |
| **`background.html` 404 no build final** | O Vite não empacotou a segunda página HTML. | Garanta que `rollupOptions.input` no `vite.config.ts` lista tanto `index.html` quanto `background.html`. |
| **Conflito de metadados entre extensões** | Chave de metadado muito genérica (ex: `hp`). | Use sempre o padrão reverse domain: `com.autor.extensao/propriedade`. |
