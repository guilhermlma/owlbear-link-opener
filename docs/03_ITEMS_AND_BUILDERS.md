# Owlbear Rodeo 2.0 — Sistema de Itens e Builders

No Owlbear Rodeo, qualquer entidade visual sobre o tabuleiro (mapas, tokens de monstros, anotações, desenhos, réguas e anéis de status) é representada como um **`Item`**.

---

## 1. Estrutura do Objeto `Item`

Todo item compartilha a seguinte interface base:

```typescript
interface Item {
  readonly id: string;               // Identificador único (UUID)
  readonly type: string;             // "IMAGE" | "SHAPE" | "TEXT" | "LINE" | "CURVE" | "PATH" | "POINTER" | "RULER" | etc.
  name: string;                      // Nome do item (ex: "Goblin 1", "Fireball AoE")
  visible: boolean;                  // Se está visível para jogadores
  locked: boolean;                   // Se está bloqueado contra seleção/arraste acidental
  createdUserId: string;             // ID do usuário que criou
  zIndex: number;                    // Ordem de profundidade na camada
  position: { x: number; y: number };// Posição no mundo virtual do mapa
  rotation: number;                  // Rotação em graus (0 a 360)
  scale: { x: number; y: number };   // Escala ({ x: 1, y: 1 } padrão)
  metadata: Record<string, unknown>; // Metadados customizados da extensão
  layer: Layer;                      // Camada do item
  
  // Propriedades de Anexo (Attachment System)
  attachedTo?: string;               // ID do item pai (ex: token do personagem)
  disableHit?: boolean;              // Se true, cliques do mouse atravessam o item
  disableAutoZIndex?: boolean;       // Impede o Owlbear de reorganizar o zIndex
  disableAttachmentBehavior?: AttachmentBehavior[];
}
```

---

## 2. Camadas do Tabuleiro (`Layer`)

O Owlbear organiza o renderizador em camadas com ordens estritas:

| Camada | Descrição |
| :--- | :--- |
| `MAP` | Imagens de fundo do mapa. Bloqueadas e no fundo por padrão. |
| `GRID` | Grade visual do mapa. |
| `DRAWING` | Desenhos feitos à mão livre. |
| `PROP` | Objetos de cenário (mesas, árvores, baús, armadilhas visíveis). |
| `MOUNT` | Montarias e veículos (ficam logo abaixo dos personagens). |
| `CHARACTER` | Tokens de personagens de jogadores e monstros/NPCs. |
| `ATTACHMENT` | **Ideal para extensões**: Anéis de status, barras de vida, auras e halos presos a tokens. |
| `NOTE` | Notas e post-its colocados na cena. |
| `TEXT` | Caixas de texto no mapa. |
| `RULER` | Réguas de medição de distância. |
| `FOG` | Formas de névoa de guerra. |
| `POINTER` | Marcadores de atenção / lasers apontados na mesa. |

---

## 3. O Sistema de Anexos (`attachedTo`)

Um dos recursos mais poderosos para extensões é a capacidade de **anexar itens a um token pai**.

Quando um item possui `attachedTo: tokenId`:
- O item filho acompanha automaticamente a **posição**, **rotação** e **escala** do item pai quando o usuário o move ou redimensiona.
- Se o item pai for deletado, o Owlbear deleta automaticamente os itens anexados (comportamento padrão).
- Se `disableHit: true` for definido no item anexo, o usuário continua conseguindo clicar e selecionar o token pai sem que o anel/barra de vida intercepte o clique do mouse!

### Controlando Comportamentos de Anexo (`AttachmentBehavior`)
Você pode desabilitar heranças específicas usando `disableAttachmentBehavior`:
```typescript
type AttachmentBehavior =
  | "VISIBLE"   // Não herda visibilidade do pai
  | "SCALE"     // Não redimensiona quando o pai mudar de tamanho
  | "ROTATION"  // Não gira quando o pai girar
  | "POSITION"  // Não move junto com o pai
  | "DELETE"    // Não é deletado quando o pai for deletado
  | "LOCKED"    // Não herda estado de trancamento
  | "COPY";     // Não duplica junto se o pai for copiado
```

---

## 4. Item Builders (Construtores Tipados)

O SDK disponibiliza funções builder fluentes para criar itens sem necessidade de montar manualmente objetos JSON complexos.

### 4.1. Criando Formas Geométricas (`buildShape`)
Perfeito para auras de alcance, cones de magia, círculos de status e marcadores:

```typescript
import { buildShape } from "@owlbear-rodeo/sdk";

const anelDeFogo = buildShape()
  .shapeType("CIRCLE") // "CIRCLE" | "RECTANGLE" | "TRIANGLE" | "HEXAGON"
  .width(150)
  .height(150)
  .position({ x: 200, y: 300 })
  .fillColor("#ff5500")
  .fillOpacity(0.2)           // Preenchimento semitransparente
  .strokeColor("#ff0000")     // Borda sólida
  .strokeWidth(4)
  .strokeOpacity(1)
  .layer("ATTACHMENT")
  .attachedTo(tokenPai.id)     // Segue o token pai
  .disableHit(true)           // Não atrapalha o clique no token
  .locked(true)
  .name("Aura de Fogo")
  .metadata({ "com.meuprojeto/tipo": "aura_dano" })
  .build();

await OBR.scene.items.addItems([anelDeFogo]);
```

### 4.2. Criando Textos e Rótulos (`buildText`)
Ideal para contadores de dano flutuantes, nomes customizados ou valores de iniciativa:

```typescript
import { buildText } from "@owlbear-rodeo/sdk";

const etiquetaHP = buildText()
  .plainText("HP: 45/50")
  .position({ x: tokenPai.position.x, y: tokenPai.position.y - 30 })
  .fontSize(16)
  .fontFamily("Roboto")
  .textAlign("CENTER")
  .textFillColor("#00ff66")
  .layer("ATTACHMENT")
  .attachedTo(tokenPai.id)
  .disableHit(true)
  .build();

await OBR.scene.items.addItems([etiquetaHP]);
```

### 4.3. Criando Linhas e Curvas (`buildLine` e `buildCurve`)
Para traçar linhas de visão, caminhos percorridos ou réguas personalizadas:

```typescript
import { buildLine } from "@owlbear-rodeo/sdk";

const linha = buildLine()
  .startPosition({ x: 100, y: 100 })
  .endPosition({ x: 300, y: 300 })
  .strokeColor("#ffff00")
  .strokeWidth(3)
  .layer("DRAWING")
  .build();

await OBR.scene.items.addItems([linha]);
```

---

## 5. Type Guards (Verificação de Tipos em Tempo de Execução)

O SDK fornece funções utilitárias para checar tipos de itens com segurança em TypeScript:

```typescript
import {
  isImage,  // Item é um token ou imagem de mapa
  isShape,  // Item é círculo, retângulo, etc.
  isText,   // Item é caixa de texto
  isLine,   // Item é linha reta
  isCurve,  // Item é curva Bezier
  isPointer // Item é laser/marcador
} from "@owlbear-rodeo/sdk";

const items = await OBR.scene.items.getItems();

for (const item of items) {
  if (isImage(item)) {
    // TypeScript agora sabe que item possui item.image e item.grid
    console.log("Token:", item.name, item.image.url);
  } else if (isShape(item)) {
    // TypeScript agora sabe que item possui item.shapeType e item.style
    console.log("Forma:", item.shapeType, item.style.strokeColor);
  }
}
```
