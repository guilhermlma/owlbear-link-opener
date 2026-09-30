import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const METADATA_KEY = "rodeo.owlbear.link-opener/data";
const ID_ADD = "rodeo.owlbear.link-opener/add";
const ID_OPEN = "rodeo.owlbear.link-opener/open";
const ID_REMOVE = "rodeo.owlbear.link-opener/remove";

// Dynamically resolve absolute URL of icon.svg to work across localhost, GitHub Pages, etc.
const ICON_URL = new URL("../icon.svg", import.meta.url).href;

OBR.onReady(async () => {
  await updateMenu();

  // Monitor selection, item changes, and scene readiness to keep context menus synchronized
  OBR.player.onChange(updateMenu);
  OBR.scene.items.onChange(updateMenu);
  OBR.scene.onReadyChange(updateMenu);
});

async function updateMenu() {
  const isReady = await OBR.scene.isReady();
  if (!isReady) {
    await clearAllMenus();
    return;
  }

  const selection = await OBR.player.getSelection();
  if (!selection || selection.length !== 1) {
    await clearAllMenus();
    return;
  }

  const [item] = await OBR.scene.items.getItems(selection);
  if (!item) {
    await clearAllMenus();
    return;
  }

  const data = item.metadata[METADATA_KEY];

  // Remove existing menu items first to avoid any duplicate ID conflicts
  await clearAllMenus();

  if (data && data.url) {
    const buttonLabel = data.name?.trim() || "Open Link";

    // 1. OPEN LINK BUTTON
    // No permission filter: all users in the room (GM and Players, even with 0 room permissions) can open the link
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
      onClick: (context) => {
        const targetItem = context?.items?.[0] || item;
        const currentData = targetItem?.metadata?.[METADATA_KEY] || data;
        const targetUrl = currentData?.url;
        if (!targetUrl) return;

        const win = window.open(targetUrl, "_blank", "noopener,noreferrer");
        if (!win) {
          OBR.notification.show("Popup blocked by browser. Please allow popups for Owlbear.", "WARNING");
        }
      }
    });

    // 2. REMOVE LINK BUTTON
    // Restricted to users with UPDATE permissions on this item
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
      onClick: async (context) => {
        const targetId = context?.items?.[0]?.id || item.id;
        await OBR.scene.items.updateItems([targetId], (draft) => {
          delete draft[0].metadata[METADATA_KEY];
        });
        OBR.notification.show("Link removed!", "INFO");
        await updateMenu();
      }
    });
  } else {
    // 3. ADD LINK BUTTON
    // Restricted to users with UPDATE permissions on this item
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
      onClick: async (context) => {
        const targetId = context?.items?.[0]?.id || item.id;
        let url = window.prompt("Enter link URL:");
        if (!url || !url.trim()) return;

        url = url.trim();
        if (!/^https?:\/\//i.test(url)) {
          url = "https://" + url;
        }

        let name = window.prompt("Enter link name:");
        name = name ? name.trim() : "";

        await OBR.scene.items.updateItems([targetId], (draft) => {
          draft[0].metadata[METADATA_KEY] = { url, name };
        });

        OBR.notification.show("Link added!", "SUCCESS");
        await updateMenu();
      }
    });
  }
}

async function clearAllMenus() {
  try {
    await OBR.contextMenu.remove(ID_ADD);
  } catch {}
  try {
    await OBR.contextMenu.remove(ID_OPEN);
  } catch {}
  try {
    await OBR.contextMenu.remove(ID_REMOVE);
  } catch {}
}
