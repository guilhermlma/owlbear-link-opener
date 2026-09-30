import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const METADATA_KEY = "rodeo.owlbear.link-opener/data";
const MODAL_ID = "rodeo.owlbear.link-opener/modal";

let currentItem = null;

OBR.onReady(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get("itemId");

  let items = [];
  if (targetId) {
    items = await OBR.scene.items.getItems([targetId]);
  } else {
    const selection = await OBR.player.getSelection();
    if (selection && selection.length > 0) {
      items = await OBR.scene.items.getItems([selection[0]]);
    }
  }

  if (!items || items.length === 0) {
    document.getElementById("tokenBadge").textContent = "Nenhum token encontrado";
    return;
  }

  currentItem = items[0];
  const tokenName = currentItem.name?.trim() || "Token sem nome";
  document.getElementById("tokenBadge").textContent = `Token: ${tokenName}`;

  const existingData = currentItem.metadata[METADATA_KEY];
  const urlInput = document.getElementById("urlInput");
  const nameInput = document.getElementById("nameInput");
  const btnDelete = document.getElementById("btnDelete");
  const title = document.getElementById("title");

  if (existingData && existingData.url) {
    title.textContent = "Editar Link do Token";
    urlInput.value = existingData.url;
    nameInput.value = existingData.name || "";
    btnDelete.style.display = "inline-flex";
  } else {
    title.textContent = "Vincular Link ao Token";
    if (tokenName && tokenName !== "Token sem nome") {
      nameInput.value = tokenName;
    }
  }

  urlInput.focus();
  urlInput.select();

  // Button actions
  document.getElementById("btnSave").addEventListener("click", handleSave);
  document.getElementById("btnCancel").addEventListener("click", handleClose);
  btnDelete.addEventListener("click", handleDelete);

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  });
});

async function handleSave() {
  if (!currentItem) return;

  const urlInput = document.getElementById("urlInput");
  const nameInput = document.getElementById("nameInput");

  let url = urlInput.value.trim();
  if (!url) {
    urlInput.focus();
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  const name = nameInput.value.trim();

  await OBR.scene.items.updateItems([currentItem.id], (draft) => {
    draft[0].metadata[METADATA_KEY] = { url, name };
  });

  await OBR.notification.show(
    name ? `Link "${name}" salvo no token!` : "Link salvo com sucesso!",
    "SUCCESS"
  );

  handleClose();
}

async function handleDelete() {
  if (!currentItem) return;

  await OBR.scene.items.updateItems([currentItem.id], (draft) => {
    delete draft[0].metadata[METADATA_KEY];
  });

  await OBR.notification.show("Link removido do token.", "INFO");
  handleClose();
}

async function handleClose() {
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {
    window.close();
  }
}
