import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const METADATA_KEY = "rodeo.owlbear.link-opener/data";
const ID_ADD = "rodeo.owlbear.link-opener/add";
const ID_OPEN = "rodeo.owlbear.link-opener/open";
const ID_REMOVE = "rodeo.owlbear.link-opener/remove";

// Resolve a URL absoluta do ícone preto para funcionar em qualquer host (localhost, GitHub Pages, etc.)
const ICON_URL = new URL("../icon.svg", import.meta.url).href;

OBR.onReady(async () => {
  await updateMenu();

  // Monitora seleção e mudanças de itens para manter os menus sincronizados
  OBR.player.onChange(updateMenu);
  OBR.scene.items.onChange(updateMenu);
});

async function updateMenu() {
  const selection = await OBR.player.getSelection();

  if (!selection || selection.length !== 1) {
    await OBR.contextMenu.remove(ID_ADD);
    await OBR.contextMenu.remove(ID_OPEN);
    await OBR.contextMenu.remove(ID_REMOVE);
    return;
  }

  const [item] = await OBR.scene.items.getItems(selection);
  if (!item) return;

  const data = item.metadata[METADATA_KEY];

  if (data && data.url) {
    // 1. O item já possui link: esconde 'Add Link'
    await OBR.contextMenu.remove(ID_ADD);

    const buttonLabel = data.name?.trim() || "Open Link";

    // 2. BOTÃO DE ABRIR O LINK:
    // Sem restrição de permissão: qualquer jogador na sala consegue abrir!
    await OBR.contextMenu.create({
      id: ID_OPEN,
      icons: [
        {
          icon: ICON_URL,
          label: buttonLabel,
          filter: {
            min: 1,
            max: 1,
            roles: ["GM", "PLAYER"]
          }
        }
      ],
      onClick: () => {
        const win = window.open(data.url, "_blank", "noopener,noreferrer");
        if (!win) {
          OBR.notification.show("Popup blocked by browser. Please allow popups for Owlbear.", "WARNING");
        }
      }
    });

    // 3. BOTÃO DE REMOVER:
    // Apenas quem tem permissão de UPDATE no item pode remover o link
    await OBR.contextMenu.create({
      id: ID_REMOVE,
      icons: [
        {
          icon: ICON_URL,
          label: "Remove Link",
          filter: {
            min: 1,
            max: 1,
            permissions: ["UPDATE"]
          }
        }
      ],
      onClick: async () => {
        await OBR.scene.items.updateItems([item.id], (draft) => {
          delete draft[0].metadata[METADATA_KEY];
        });
        OBR.notification.show("Link removed!", "INFO");
        await updateMenu();
      }
    });
  } else {
    // Não possui link: limpa botões de abrir/remover
    await OBR.contextMenu.remove(ID_OPEN);
    await OBR.contextMenu.remove(ID_REMOVE);

    // BOTÃO DE ADICIONAR:
    // Exibido apenas para quem tem permissão de UPDATE no item
    await OBR.contextMenu.create({
      id: ID_ADD,
      icons: [
        {
          icon: ICON_URL,
          label: "Add Link",
          filter: {
            min: 1,
            max: 1,
            permissions: ["UPDATE"]
          }
        }
      ],
      onClick: async () => {
        let url = window.prompt("Enter link URL:");
        if (!url || !url.trim()) return;

        url = url.trim();
        if (!/^https?:\/\//i.test(url)) {
          url = "https://" + url;
        }

        let name = window.prompt("Enter link name:");
        name = name ? name.trim() : "";

        await OBR.scene.items.updateItems([item.id], (draft) => {
          draft[0].metadata[METADATA_KEY] = { url, name };
        });

        OBR.notification.show("Link added!", "SUCCESS");
        await updateMenu();
      }
    });
  }
}
