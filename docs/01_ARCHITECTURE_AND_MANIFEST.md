# Owlbear Rodeo 2.0 — Guia de Arquitetura e Manifest

Este documento descreve a arquitetura técnica, modelo de execução e especificações do arquivo `manifest.json` do **Owlbear Rodeo 2.0 (OBR)**.

---

## 1. Visão Geral da Arquitetura

O Owlbear Rodeo 2.0 foi desenhado com base em extensibilidade web aberta:
- **Toda extensão é uma aplicação web padrão**: Composta por HTML, CSS, JavaScript ou TypeScript.
- **Ambiente de Execução (Sandbox)**: A interface do Owlbear Rodeo roda no domínio principal (ex: `https://owlbear.app` ou `https://owlbear.rodeo`). Quando uma extensão é ativada em uma sala, o Owlbear carrega as páginas da extensão em elementos `<iframe>` isolados.
- **Canal de Comunicação (Message Bus)**: A extensão comunica-se bidirecionalmente com o Owlbear via `window.postMessage`, encapsulado com tipagem forte e promessas pelo pacote oficial **`@owlbear-rodeo/sdk`**.

### O Handshake de Inicialização (`obrref`)
Quando o Owlbear instancia um iframe de extensão (seja um popover, script de fundo ou modal), ele injeta um parâmetro na query string da URL:
```text
https://sua-extensao.com/background.html?obrref=<string_base64>
```
O valor decodificado de `obrref` contém:
```text
<origin_do_owlbear> <id_da_sala>
```
Ao importar `@owlbear-rodeo/sdk`, a biblioteca automaticamente:
1. Extrai `obrref` da URL atual.
2. Identifica a origem segura do Owlbear e o ID da sala (`roomId`).
3. Estabelece a conexão e sinaliza o evento `OBR_READY`.
4. A propriedade `OBR.isAvailable` torna-se `true` quando a página está devidamente embutida no Owlbear.

---

## 2. Tipos de Pontos de Entrada (Extension Points)

Uma extensão do Owlbear pode operar em um ou mais dos seguintes modos:

| Ponto de Entrada | Configuração | Descrição |
| :--- | :--- | :--- |
| **Action Popover** | `manifest.json -> "action"` | Botão na barra de ferramentas/extensões do Owlbear. Ao clicar, abre um popover/painel flutuante com a interface HTML da extensão. |
| **Background Script** | `manifest.json -> "background_url"` | Iframe invisível e persistente enquanto a sala estiver aberta. Registra ferramentas, menus de contexto e escuta eventos em segundo plano. |
| **Context Menu** | Criado dinamicamente via `OBR.contextMenu.create()` | Botão adicionado ao menu radial/contextual que surge ao clicar com botão direito sobre tokens ou itens da cena. Pode disparar funções ou embutir uma UI. |
| **Custom Tool** | Criado dinamicamente via `OBR.tool.create()` | Nova ferramenta na barra lateral (ao lado de Laser, Régua, Desenho), com suporte a modos, cursores e eventos de mouse/arrasto. |
| **Modals & Popovers** | Criados dinamicamente via `OBR.modal.open()` ou `OBR.popover.open()` | Janelas modais com backdrop ou popovers flutuantes ancorados a elementos específicos. |

---

## 3. Especificação do `manifest.json`

O arquivo `manifest.json` é o coração da distribuição da extensão. É a URL pública deste arquivo que o usuário insere no Owlbear em **Profile > Add Extension**.

> [!IMPORTANT]
> **Diferença de Extensões de Navegador:** O `manifest.json` do Owlbear Rodeo **não** é o manifest do Chrome/Firefox WebExtensions (Manifest V3). Não possui `permissions`, `content_scripts` ou `service_worker`. Ele segue o esquema próprio do Owlbear Rodeo versão 1.

### 3.1. Campos Obrigatórios e Opcionais

```json
{
  "name": "Nome da Extensão",
  "version": "1.0.0",
  "manifest_version": 1,
  "author": "Nome do Autor",
  "icon": "/logo.png",
  "description": "Breve descrição do que a extensão faz.",
  "homepage_url": "https://github.com/usuario/meu-projeto",
  
  "action": {
    "title": "Título exibido no tooltip",
    "icon": "/icon.svg",
    "popover": "/",
    "width": 350,
    "height": 500
  },
  
  "background_url": "/background.html"
}
```

### 3.2. Detalhes dos Campos:

- **`name`** *(string, obrigatório)*: Nome de exibição da extensão no gerenciador de extensões.
- **`version`** *(string, obrigatório)*: Versão semântica (ex: `"1.0.0"`).
- **`manifest_version`** *(number, obrigatório)*: Atualmente deve ser sempre `1`.
- **`author`** *(string, obrigatório)*: Nome ou empresa do desenvolvedor.
- **`icon`** *(string, obrigatório)*: Caminho relativo ou URL absoluta para o ícone da extensão no catálogo (PNG ou SVG recomendado, ex: 128x128).
- **`description`** *(string, opcional)*: Texto explicativo sobre as funcionalidades da extensão.
- **`homepage_url`** *(string, opcional)*: Link para o site oficial, repositório ou página de suporte.
- **`action`** *(object, opcional)*:
  - **`title`** *(string)*: Texto mostrado no tooltip do botão da barra de ação.
  - **`icon`** *(string)*: Caminho relativo para o ícone SVG/PNG exibido na barra.
  - **`popover`** *(string)*: Caminho relativo da página HTML do popover (ex: `"/"` para `index.html`).
  - **`width`** *(number)*: Largura padrão inicial da janela em pixels.
  - **`height`** *(number)*: Altura padrão inicial da janela em pixels.
- **`background_url`** *(string, opcional)*: Caminho relativo para uma página HTML (ex: `"/background.html"`) carregada de forma invisível quando a extensão é habilitada na sala.

---

## 4. Ciclo de Vida: Inicialização e Disponibilidade

### 4.1. `OBR.onReady` vs `OBR.isReady`
O SDK precisa de um handshake assíncrono para garantir que os listeners de mensagem foram registrados. **Nunca chame métodos da API antes de `OBR.onReady`**.

```typescript
import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(async () => {
  console.log("SDK pronto para uso!");
  console.log("ID do Usuário:", OBR.player.id);
  console.log("ID da Sala:", OBR.room.id);
});
```

### 4.2. Diferença Crítica: SDK Ready vs Scene Ready
Estar pronto no SDK **não significa** que um mapa/cena está carregado na tela. A sala pode estar sem cena aberta (tela preta/vazia aguardando o mestre selecionar um mapa).

```typescript
OBR.onReady(async () => {
  // 1. Verifica se já há uma cena ativa
  const sceneActive = await OBR.scene.isReady();
  if (sceneActive) {
    carregarItensDaCena();
  }

  // 2. Escuta quando o mestre abre ou fecha um mapa
  OBR.scene.onReadyChange((isReady) => {
    if (isReady) {
      console.log("Um mapa foi aberto.");
      carregarItensDaCena();
    } else {
      console.log("Nenhum mapa ativo no momento.");
    }
  });
});
```

---

## 5. Modelo de Segurança e Hospedagem

1. **Protocolo HTTPS Obrigatório em Produção**: O Owlbear roda sob HTTPS. Navegadores bloqueiam conteúdo misto (Mixed Content). Todas as páginas da extensão em produção devem ser servidas via HTTPS com certificado válido.
2. **Localhost Permitido em Desenvolvimento**: Os navegadores tratam `http://localhost:<porta>` como uma origem segura (`Secure Context`), permitindo testar diretamente sem HTTPS configurado.
3. **CORS e Cabeçalhos**: O `manifest.json` e os assets estáticos devem permitir serem carregados por qualquer origem (cabeçalho `Access-Control-Allow-Origin: *` em assets estáticos ou sem restrição no `manifest.json`).
4. **Hospedagem Estática Sem Servidor**: A extensão não necessita de backend dedicado. Pode ser hospedada gratuitamente em GitHub Pages, Cloudflare Pages, Vercel ou Netlify.
