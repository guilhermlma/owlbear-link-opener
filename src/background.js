import OBR from "./obr-sdk.js";

const ID = "com.guilherme.link-opener";
const META_KEY = `${ID}/data`;

const registeredMenus = new Map();

async function updateContextMenus(items) {
  const currentItemIds = new Set(items.map(i => i.id));

  // Remove menus for items that no longer exist
  for (const menuId of registeredMenus.keys()) {
    const itemId = menuId.replace(`${ID}/open/`, "");
    if (!currentItemIds.has(itemId)) {
      OBR.contextMenu.remove(menuId);
      registeredMenus.delete(menuId);
    }
  }

  // Create or update dynamic context menus for items with links
  for (const item of items) {
    const data = item.metadata[META_KEY];
    const menuId = `${ID}/open/${item.id}`;
    
    if (data && data.url) {
      const currentLabel = data.label || "Open Link";
      
      // If menu is not registered for this item yet, or label changed
      if (registeredMenus.get(menuId) !== currentLabel) {
        OBR.contextMenu.create({
          id: menuId,
          icons: [
            {
              icon: "https://guilhermlma.github.io/owlbear-link-opener/icon.svg",
              label: currentLabel,
              filter: {
                every: [{ key: "id", value: item.id }],
                roles: ["GM", "PLAYER"]
              },
            }
          ],
          onClick: () => {
            // Fetch the freshest URL right when clicking
            OBR.scene.items.getItems([item.id]).then(itms => {
              const d = itms[0]?.metadata[META_KEY];
              if (d && d.url) window.open(d.url, "_blank");
            });
          }
        });
        registeredMenus.set(menuId, currentLabel);
      }
    } else {
      // Item exists but link was removed
      if (registeredMenus.has(menuId)) {
        OBR.contextMenu.remove(menuId);
        registeredMenus.delete(menuId);
      }
    }
  }
}

OBR.onReady(async () => {
  // 1. Add Link Button (Static, only shows when NO link exists)
  OBR.contextMenu.create({
    id: `${ID}/add`,
    icons: [
      {
        icon: "https://guilhermlma.github.io/owlbear-link-opener/icon.svg",
        label: "Add Link",
        filter: {
          every: [
            { key: "type", value: "IMAGE" },
            { key: ["metadata", META_KEY], value: undefined }
          ],
          permissions: ["UPDATE"]
        },
      }
    ],
    onClick: async (context) => {
      const item = context.items[0];
      const url = window.prompt("Enter the link URL (e.g. https://...):");
      
      if (!url) return;

      const label = window.prompt("Enter the button name:") || "Open Link";
      const finalUrl = url.startsWith("http") ? url : `https://${url}`;

      await OBR.scene.items.updateItems([item.id], (items) => {
        for (let i of items) {
          i.metadata[META_KEY] = {
            url: finalUrl,
            label: label
          };
        }
      });
    }
  });

  // 2. Remove Link Button (Static, only shows when link exists)
  OBR.contextMenu.create({
    id: `${ID}/remove`,
    icons: [
      {
        icon: "https://guilhermlma.github.io/owlbear-link-opener/icon.svg",
        label: "Remove Link",
        filter: {
          every: [
            { key: ["metadata", META_KEY], value: undefined, operator: "!=" }
          ],
          permissions: ["UPDATE"]
        },
      }
    ],
    onClick: async (context) => {
      if (window.confirm("Are you sure you want to remove this link?")) {
        const itemIds = context.items.map(i => i.id);
        await OBR.scene.items.updateItems(itemIds, (items) => {
          for (let item of items) {
            delete item.metadata[META_KEY];
          }
        });
      }
    }
  });

  // Initial scan to create menus for items that already have links
  const items = await OBR.scene.items.getItems();
  updateContextMenus(items);

  // Subscribe to changes to dynamically generate buttons when new links are added/edited
  OBR.scene.items.onChange((updatedItems) => {
    updateContextMenus(updatedItems);
  });
});
