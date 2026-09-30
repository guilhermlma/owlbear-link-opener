# Owlbear Rodeo 2.0 — Padrões de Projeto e Receitas Práticas

Este documento reúne receitas de implementação testadas em produção para os cenários mais comuns de extensão.

---

## Receita 1: Painel de Ação (Action Popover com Sincronização)

Ideal para painéis como **Rastreador de Iniciativa**, **Calculadora de Dano** ou **Ficha de Combate**.

### Padrão de Inicialização Robusto:
O erro mais comum é tentar acessar itens antes do mapa estar pronto. O padrão correto é:

```typescript
import OBR, { Image } from "@owlbear-rodeo/sdk";

OBR.onReady(async () => {
  // 1. Monitora se a cena está ativa
  const checkScene = async (isReady: boolean) => {
    if (!isReady) {
      document.querySelector("#app")!.innerHTML = `
        <div class="empty-state">Abra um mapa para usar a extensão.</div>
      `;
      return;
    }
    
    // Cena está pronta: carregar dados e renderizar
    await renderizarTokens();
  };

  const sceneReady = await OBR.scene.isReady();
  await checkScene(sceneReady);
  OBR.scene.onReadyChange(checkScene);

  // 2. Escutar mudanças nos itens em tempo real
  OBR.scene.items.onChange(async () => {
    if (await OBR.scene.isReady()) {
      await renderizarTokens();
    }
  });
});

async function renderizarTokens() {
  // Busca apenas tokens de personagens
  const tokens = await OBR.scene.items.getItems<Image>(
    (item) => item.layer === "CHARACTER"
  );

  const container = document.querySelector("#app")!;
  container.innerHTML = tokens
    .map(
      (token) => `
      <div class="token-card" data-id="${token.id}">
        <span class="name">${token.name || "Sem Nome"}</span>
        <input type="number" class="hp-input" value="${token.metadata["com.exemplo/hp"] ?? 10}" />
      </div>
    `
    )
    .join("");

  // Adiciona listeners para atualizar vida
  container.querySelectorAll(".hp-input").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const target = e.target as HTMLInputElement;
      const card = target.closest(".token-card") as HTMLElement;
      const tokenId = card.dataset.id!;
      const novoHp = parseInt(target.value, 10);

      // Atualiza com Immer
      await OBR.scene.items.updateItems([tokenId], (draft) => {
        for (const item of draft) {
          item.metadata["com.exemplo/hp"] = novoHp;
        }
      });
    });
  });
}
```

---

## Receita 2: Script de Fundo + Menu de Contexto Embutido (Context Menu Embed)

Este padrão é o mesmo utilizado pela extensão oficial **Colored Rings**. Ele registra um menu que, ao ser clicado, abre uma mini interface embutida diretamente na barra inferior do menu radial.

### 1. `background.ts` (Script que roda silenciosamente)
```typescript
import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  OBR.contextMenu.create({
    id: "com.exemplo.aneis/menu",
    icons: [
      {
        icon: "/icone-anel.svg",
        label: "Adicionar Condição",
        filter: {
          every: [
            { key: "type", value: "IMAGE" },
            { key: "layer", value: "CHARACTER" }
          ],
          permissions: ["UPDATE"] // Exige permissão de edição
        }
      }
    ],
    embed: {
      url: "/", // Carrega o index.html na mini-barra
      height: 70
    }
  });
});
```

### 2. `main.ts` (Interface do Popover / Embed)
```typescript
import OBR, { buildShape, Image, Shape } from "@owlbear-rodeo/sdk";

const METADATA_KEY = "com.exemplo.aneis/anel-ativo";

OBR.onReady(() => {
  document.querySelector("#btn-veneno")?.addEventListener("click", async () => {
    const selection = await OBR.player.getSelection();
    if (!selection) return;

    const tokens = await OBR.scene.items.getItems<Image>(selection);
    const dpi = await OBR.scene.grid.getDpi();

    for (const token of tokens) {
      // Cria um círculo verde anexado ao token
      const ring = buildShape()
        .shapeType("CIRCLE")
        .width(token.image.width * (dpi / token.grid.dpi))
        .height(token.image.height * (dpi / token.grid.dpi))
        .strokeColor("#00ff44")
        .strokeWidth(6)
        .fillOpacity(0)
        .layer("ATTACHMENT")
        .attachedTo(token.id)
        .disableHit(true)
        .locked(true)
        .name("Condição: Envenenado")
        .metadata({ [METADATA_KEY]: true })
        .build();

      await OBR.scene.items.addItems([ring]);
    }
  });
});
```

---

## Receita 3: Ferramenta Customizada com Arrastar do Mouse (Custom Tool)

Permite criar ferramentas que interagem diretamente com o mouse na mesa virtual (ex: ferramenta para desenhar áreas de efeito / magias AoE).

```typescript
import OBR, { buildShape, ToolContext, ToolEvent } from "@owlbear-rodeo/sdk";

const TOOL_ID = "com.exemplo.magias/ferramenta-cone";

OBR.onReady(async () => {
  let pontoInicial: { x: number; y: number } | null = null;
  let formaLocalId: string | null = null;

  await OBR.tool.create({
    id: TOOL_ID,
    icons: [
      {
        icon: "/icone-magia.svg",
        label: "Criar Área de Efeito"
      }
    ],
    defaultMode: "cone",
    defaultMetadata: {}
  });

  await OBR.tool.createMode({
    id: "cone",
    toolId: TOOL_ID,
    icons: [
      {
        icon: "/icone-cone.svg",
        label: "Modo Círculo"
      }
    ],
    // 1. Mouse Pressionado no Tabuleiro
    onToolDown: async (context: ToolContext, event: ToolEvent) => {
      pontoInicial = event.pointerPosition;
    },
    // 2. Mouse Sendo Arrastado (Pré-visualização Local)
    onToolDragMove: async (context: ToolContext, event: ToolEvent) => {
      if (!pontoInicial) return;

      const raio = Math.hypot(
        event.pointerPosition.x - pontoInicial.x,
        event.pointerPosition.y - pontoInicial.y
      );

      // Usamos OBR.scene.local para não sobrecarregar a rede dos outros jogadores
      const preview = buildShape()
        .shapeType("CIRCLE")
        .position(pontoInicial)
        .width(raio * 2)
        .height(raio * 2)
        .fillColor("#ff8800")
        .fillOpacity(0.3)
        .strokeColor("#ff4400")
        .strokeWidth(2)
        .layer("DRAWING")
        .build();

      if (formaLocalId) {
        await OBR.scene.local.deleteItems([formaLocalId]);
      }
      await OBR.scene.local.addItems([preview]);
      formaLocalId = preview.id;
    },
    // 3. Mouse Solto (Gravação Definitiva na Cena Compartilhada)
    onToolDragEnd: async (context: ToolContext, event: ToolEvent) => {
      if (!pontoInicial) return;

      // Limpa pré-visualização local
      if (formaLocalId) {
        await OBR.scene.local.deleteItems([formaLocalId]);
        formaLocalId = null;
      }

      const raio = Math.hypot(
        event.pointerPosition.x - pontoInicial.x,
        event.pointerPosition.y - pontoInicial.y
      );

      // Cria o item definitivo visível para todos
      const finalShape = buildShape()
        .shapeType("CIRCLE")
        .position(pontoInicial)
        .width(raio * 2)
        .height(raio * 2)
        .fillColor("#ff8800")
        .fillOpacity(0.3)
        .strokeColor("#ff4400")
        .strokeWidth(3)
        .layer("DRAWING")
        .name("Área de Efeito")
        .build();

      await OBR.scene.items.addItems([finalShape]);
      pontoInicial = null;
    }
  });
});
```

---

## Receita 4: Comunicação em Tempo Real com Broadcast e Notificações

Envio de rolagens de dados ou eventos sem persistência desnecessária:

```typescript
import OBR from "@owlbear-rodeo/sdk";

const CHANNEL = "com.exemplo.rolador/dados";

interface RollMessage {
  jogador: string;
  expressao: string;
  resultado: number;
}

// Escutando mensagens de todos
OBR.broadcast.onMessage(CHANNEL, ({ data }) => {
  const roll = data as RollMessage;
  OBR.notification.show(
    `🎲 ${roll.jogador} rolou ${roll.expressao} e tirou ${roll.resultado}!`,
    roll.resultado === 20 ? "SUCCESS" : "DEFAULT"
  );
});

// Enviando uma rolagem
async function rolarDado(expressao: string) {
  const nome = await OBR.player.getName();
  const resultado = Math.floor(Math.random() * 20) + 1;

  await OBR.broadcast.sendMessage(
    CHANNEL,
    { jogador: nome, expressao, resultado },
    { destination: "ALL" } // Dispara localmente e para todos os outros
  );
}
```

---

## Receita 5: Boas Práticas para Metadados (Namespace Pattern)

No Owlbear Rodeo, o objeto `metadata` de cenas, salas e itens é compartilhado entre todas as extensões ativas.

> [!CAUTION]
> **Nunca use chaves genéricas** como `hp`, `status`, `ativo` ou `selected` diretamente na raiz de `item.metadata`.

Sempre siga a convenção de **Reverse Domain Name**:
```typescript
// ✅ CORRETO
const PLUGIN_ID = "com.meunome.meu-rastreador";

item.metadata[`${PLUGIN_ID}/hp`] = 45;
item.metadata[`${PLUGIN_ID}/condicoes`] = ["cego", "envenenado"];

// Ou agrupado em um objeto:
item.metadata[PLUGIN_ID] = {
  hp: 45,
  hpMax: 50,
  iniciativa: 18
};

// ❌ ERRADO (Pode ser sobrescrito por outro plugin!)
item.metadata["hp"] = 45;
```
