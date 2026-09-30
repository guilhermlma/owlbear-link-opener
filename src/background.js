import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const METADATA_KEY = "rodeo.owlbear.link-opener/data";
const ID_OPEN = "rodeo.owlbear.link-opener/open";
const ID_EDIT = "rodeo.owlbear.link-opener/edit";
const MODAL_ID = "rodeo.owlbear.link-opener/modal";

const ICON_URL = new URL("../icon.svg", import.meta.url).href;

OBR.onReady(async () => {
  // Inicializa os menus de contexto uma única vez
  await setupContextMenus();

  // Atualiza os rótulos dinamicamente ao selecionar itens
  OBR.player.onChange(updateMenuLabels);
  OBR.scene.items.onChange(updateMenuLabels);
  OBR.scene.onReadyChange((isReady) => {
    if (isReady) updateMenuLabels();
  });
});

async function setupContextMenus() {
  // Menu 1: Botão Principal (Abrir Link se existir, ou Adicionar Link se não houver)
  await OBR.contextMenu.create({
    id: ID_OPEN,
    icons: [
      {
        icon: ICON_URL,
        label: "🔗 Link",
        filter: {
          min: 1,
          max: 1,
          roles: ["GM", "PLAYER"]
        }
      }
    ],
    onClick: async (context) => {
      const item = context?.items?.[0];
      if (!item) return;

      const data = item.metadata[METADATA_KEY];
      if (data && data.url) {
        // Abre o link em nova aba
        const win = window.open(data.url, "_blank", "noopener,noreferrer");
        if (!win) {
          await OBR.notification.show(
            "Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para o Owlbear.",
            "WARNING"
          );
        }
      } else {
        // Se não possui link, abre modal para adicionar
        await openModal(item.id);
      }
    }
  });

  // Menu 2: Botão de Gerenciamento / Edição (apenas para quem pode editar o token)
  await OBR.contextMenu.create({
    id: ID_EDIT,
    icons: [
      {
        icon: ICON_URL,
        label: "⚙️ Configurar Link",
        filter: {
          min: 1,
          max: 1,
          permissions: ["UPDATE"]
        }
      }
    ],
    onClick: async (context) => {
      const item = context?.items?.[0];
      if (!item) return;
      await openModal(item.id);
    }
  });

  await updateMenuLabels();
}

async function updateMenuLabels() {
  try {
    const isReady = await OBR.scene.isReady();
    if (!isReady) return;

    const selection = await OBR.player.getSelection();
    if (!selection || selection.length !== 1) return;

    const [item] = await OBR.scene.items.getItems(selection);
    if (!item) return;

    const data = item.metadata[METADATA_KEY];

    if (data && data.url) {
      const customName = data.name?.trim();
      const openLabel = customName ? `🔗 ${customName}` : "🔗 Abrir Link";

      await OBR.contextMenu.create({
        id: ID_OPEN,
        icons: [
          {
            icon: ICON_URL,
            label: openLabel,
            filter: { min: 1, max: 1, roles: ["GM", "PLAYER"] }
          }
        ]
      });

      await OBR.contextMenu.create({
        id: ID_EDIT,
        icons: [
          {
            icon: ICON_URL,
            label: "⚙️ Editar Link",
            filter: { min: 1, max: 1, permissions: ["UPDATE"] }
          }
        ]
      });
    } else {
      await OBR.contextMenu.create({
        id: ID_OPEN,
        icons: [
          {
            icon: ICON_URL,
            label: "🔗 Adicionar Link",
            filter: { min: 1, max: 1, roles: ["GM", "PLAYER"] }
          }
        ]
      });

      await OBR.contextMenu.create({
        id: ID_EDIT,
        icons: [
          {
            icon: ICON_URL,
            label: "⚙️ Configurar Link",
            filter: { min: 1, max: 1, permissions: ["UPDATE"] }
          }
        ]
      });
    }
  } catch (err) {
    console.error("[Link Opener] Erro ao atualizar labels do menu:", err);
  }
}

async function openModal(itemId) {
  const modalUrl = new URL("../modal.html", import.meta.url);
  modalUrl.searchParams.set("itemId", itemId);

  await OBR.modal.open({
    id: MODAL_ID,
    url: modalUrl.href,
    width: 400,
    height: 340
  });
}
