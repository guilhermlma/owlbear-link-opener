# Owlbear Rodeo 2.0 — Referência Completa da API do SDK

Esta é a especificação técnica detalhada de todas as APIs expostas pelo objeto global `OBR` do pacote `@owlbear-rodeo/sdk`.

---

## 1. `OBR.action` (Barra de Ação / Popover da Extensão)

Controla o popover associado à extensão declarado no campo `"action"` do `manifest.json`.

```typescript
// Abrir e Fechar
await OBR.action.open();
await OBR.action.close();
const isOpen: boolean = await OBR.action.isOpen();

// Escutar mudanças no estado de abertura
const unsubscribe = OBR.action.onOpenChange((isOpen: boolean) => {
  console.log("Popover aberto?", isOpen);
});

// Redimensionamento dinâmico
await OBR.action.setWidth(400);
const width: number | undefined = await OBR.action.getWidth();
await OBR.action.setHeight(600);
const height: number | undefined = await OBR.action.getHeight();

// Badges (Contadores e avisos sobre o ícone na barra)
await OBR.action.setBadgeText("5");
await OBR.action.setBadgeBackgroundColor("#ff4444");
const badge: string | undefined = await OBR.action.getBadgeText();

// Alterar título e ícone em tempo de execução
await OBR.action.setTitle("Meu Rastreador (Ativo)");
await OBR.action.setIcon("/novo-icone.svg");
```

---

## 2. `OBR.contextMenu` (Menus de Contexto de Itens)

Permite registrar opções nos menus contextuais quando itens ou tokens são selecionados na mesa.

### Criação e Remoção
```typescript
await OBR.contextMenu.create({
  id: "com.exemplo.status/toggle-condicao",
  icons: [
    {
      icon: "/icones/stun.svg",
      label: "Atordoado",
      filter: {
        min: 1, // Quantidade mínima de itens selecionados
        max: 5, // Quantidade máxima
        roles: ["GM"], // Apenas Mestres ("GM" | "PLAYER")
        permissions: ["UPDATE"], // Permissão necessária ("CREATE" | "UPDATE" | "DELETE")
        every: [
          { key: "type", value: "IMAGE" },
          { key: "layer", value: "CHARACTER" }
        ],
        some: [
          { key: "metadata.com.exemplo.status/stunned", value: true, operator: "!=" }
        ]
      }
    }
  ],
  shortcut: "Shift + S", // Atalho opcional
  onClick: async (context, elementId) => {
    // context.items: Item[] selecionados
    // context.selectionBounds: BoundingBox da seleção
    // elementId: ID do elemento HTML do botão clicado (ótimo para ancorar popover)
  },
  embed: {
    // Se definido, ao clicar embutirá uma mini-UI diretamente abaixo do menu de contexto
    url: "/embed.html",
    height: 90
  }
});

// Para remover o menu:
await OBR.contextMenu.remove("com.exemplo.status/toggle-condicao");
```

---

## 3. `OBR.scene.items` (Manipulação de Itens da Cena)

Gerencia tokens, formas, imagens, desenhos e anotações presentes no mapa.

### Busca de Itens (`getItems`)
```typescript
// 1. Obter todos os itens da cena
const allItems = await OBR.scene.items.getItems();

// 2. Obter por IDs específicos
const specificItems = await OBR.scene.items.getItems(["id-item-1", "id-item-2"]);

// 3. Filtrar com função predicada
const tokens = await OBR.scene.items.getItems<Image>((item) => item.layer === "CHARACTER");
```

### Atualização com Immer (`updateItems`)
O método `updateItems` utiliza o **Immer** por debaixo dos panos. As alterações feitas no array `draft` são convertidas automaticamente em patches eficientes:

```typescript
await OBR.scene.items.updateItems(tokens, (draft) => {
  for (const token of draft) {
    // Atualizar posição
    token.position.x += 10;
    
    // Atualizar metadados customizados
    token.metadata["com.exemplo.sistema/hp"] = 42;
    
    // Bloquear ou alterar visibilidade
    token.visible = true;
    token.locked = false;
  }
});
```

### Inserção, Exclusão e Anexos
```typescript
// Adicionar novos itens (construídos com Item Builders)
await OBR.scene.items.addItems([novoCirculo, novoTexto]);

// Deletar itens
await OBR.scene.items.deleteItems(["id-item-1"]);

// Obter itens anexados a determinados itens pai
const attachments = await OBR.scene.items.getItemAttachments(["id-token-pai"]);

// Obter os limites (BoundingBox) de um grupo de itens
const bounds = await OBR.scene.items.getItemBounds(["id-token"]);
// bounds = { min: { x, y }, max: { x, y }, width, height, center: { x, y } }
```

### Observação em Tempo Real (`onChange`)
```typescript
const unsubscribe = OBR.scene.items.onChange((items) => {
  // Chamado sempre que qualquer item na cena for criado, movido ou alterado
  atualizarMinhaInterface(items);
});
```

---

## 4. `OBR.scene.local` (Itens Locais / Visíveis Apenas para o Jogador)

Possui a mesma assinatura de `OBR.scene.items` (`getItems`, `updateItems`, `addItems`, `deleteItems`, `onChange`), porém os itens criados existem **apenas na máquina do jogador local**.
- **Casos de Uso**: Réguas de medição privadas, áreas de efeito de pré-visualização antes de confirmar conjuração, halos de seleção temporários.
- Suporta `fastUpdate: true` em `updateItems` para atualizações de altíssima frequência (ex: durante o arraste do mouse).

---

## 5. `OBR.scene.grid` & `OBR.scene.fog`

### Grid (Grade)
```typescript
const dpi = await OBR.scene.grid.getDpi(); // Pontos por polegada/grid cell
const scale = await OBR.scene.grid.getScale(); // Ex: { raw: "5ft", parsed: { multiplier: 5, unit: "ft" } }
const lineType = await OBR.scene.grid.getLineType(); // "SOLID" | "DASHED"
const snap = await OBR.scene.grid.getSnap();
```

### Fog (Névoa de Guerra)
```typescript
const isFilled = await OBR.scene.fog.getFilled();
await OBR.scene.fog.setFilled(true);
const color = await OBR.scene.fog.getColor();
```

---

## 6. `OBR.room` (Persistência e Estado da Sala)

Armazena metadados globais da sala que **persistem mesmo quando o mestre muda de mapa/cena**.

```typescript
// Obter ID da sala
const roomId = OBR.room.id;

// Obter e definir metadados globais da sala
const metadata = await OBR.room.getMetadata();
await OBR.room.setMetadata({
  "com.exemplo.rastreador/ordem-iniciativa": [
    { id: "token-1", valor: 18 },
    { id: "token-2", valor: 14 }
  ]
});

// Escutar alterações nos metadados da sala
const unsub = OBR.room.onMetadataChange((metadata) => {
  console.log("Novos metadados da sala:", metadata);
});

// Permissões padrão configuradas na sala
const permissions = await OBR.room.getPermissions();
```

---

## 7. `OBR.player` (Jogador Local) & `OBR.party` (Outros Jogadores)

### Jogador Local (`OBR.player`)
```typescript
// Informações do jogador
const id = OBR.player.id; // Ou await OBR.player.getId()
const name = await OBR.player.getName();
const color = await OBR.player.getColor();
const role = await OBR.player.getRole(); // "GM" | "PLAYER"

// Seleção de itens
const selection = await OBR.player.getSelection(); // string[] de IDs selecionados
await OBR.player.select(["id-item-1"], true); // true = substituir seleção atual
await OBR.player.deselect();

// Metadados do jogador local
await OBR.player.setMetadata({ "com.exemplo/dados": "valor" });

// Checar permissão
const canCreate = await OBR.player.hasPermission("CREATE");

// Escutar mudanças do próprio jogador
OBR.player.onChange((player) => {
  console.log("Nome/cor/seleção mudou:", player);
});
```

### Grupo (`OBR.party`)
```typescript
// Lista de todos os jogadores conectados na sala
const players = await OBR.party.getPlayers();
for (const p of players) {
  console.log(p.id, p.name, p.role, p.color, p.selection);
}

// Escutar entradas, saídas e alterações de outros jogadores
OBR.party.onChange((players) => {
  console.log("Lista de jogadores atualizada:", players);
});
```

---

## 8. `OBR.broadcast` (Mensagens Efêmeras em Tempo Real)

Permite envio direto de mensagens peer-to-peer/servidor entre extensões dos jogadores na mesma sala sem persistência no banco.

```typescript
const CANAL = "com.exemplo.dados/rolagem";

// Enviar mensagem
await OBR.broadcast.sendMessage(
  CANAL,
  { autor: "Gandalf", dado: "1d20+5", resultado: 23 },
  { destination: "ALL" } // "ALL" | "REMOTE" (apenas outros) | "LOCAL" (apenas eu)
);

// Escutar mensagens recebidas
const unsub = OBR.broadcast.onMessage(CANAL, ({ data, connectionId }) => {
  console.log("Mensagem recebida de:", connectionId, data);
});
```

---

## 9. `OBR.popover` & `OBR.modal`

### Popover Flutuante
```typescript
await OBR.popover.open({
  id: "com.exemplo.status/popover-seletor",
  url: "/seletor.html",
  width: 250,
  height: 300,
  anchorElementId: elementId, // ElementId recebido no clique do contextMenu ou tool
  anchorOrigin: { horizontal: "CENTER", vertical: "BOTTOM" },
  transformOrigin: { horizontal: "CENTER", vertical: "TOP" },
  disableClickAway: false
});

await OBR.popover.close("com.exemplo.status/popover-seletor");
```

### Diálogo Modal
```typescript
await OBR.modal.open({
  id: "com.exemplo.config/modal",
  url: "/configuracoes.html",
  width: 500,
  height: 400,
  fullScreen: false,
  hideBackdrop: false
});

await OBR.modal.close("com.exemplo.config/modal");
```

---

## 10. `OBR.notification` & `OBR.theme`

### Notificações
Exibe toasts visuais nativos no canto da tela do Owlbear:
```typescript
const id = await OBR.notification.show(
  "Rodada finalizada com sucesso!",
  "SUCCESS" // "DEFAULT" | "INFO" | "SUCCESS" | "WARNING" | "ERROR"
);

// Fechar programaticamente se necessário
await OBR.notification.close(id);
```

### Tema (Light / Dark Mode)
```typescript
const theme = await OBR.theme.getTheme();
// theme.mode: "DARK" | "LIGHT"
// theme.primary, theme.secondary, theme.text, theme.background

// Sincronizar estilo dinamicamente
OBR.theme.onChange((novoTema) => {
  document.body.setAttribute("data-theme", novoTema.mode.toLowerCase());
});
```

---

## 11. `OBR.viewport` (Câmera e Coordenadas)

Controla o zoom e posição da visão do usuário, além de converter coordenadas de tela para coordenadas do mapa.

```typescript
// Posição e Zoom
const pos = await OBR.viewport.getPosition();
const scale = await OBR.viewport.getScale();
await OBR.viewport.animateTo({ position: { x: 500, y: 500 }, scale: 1 });

// Conversão de Coordenadas (Tela <-> Mundo do Tabuleiro)
const pontoNaMesa = await OBR.viewport.inverseTransformPoint({ x: event.clientX, y: event.clientY });
const pontoNaTela = await OBR.viewport.transformPoint({ x: token.position.x, y: token.position.y });
```
