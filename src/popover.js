import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const METADATA_KEY = "rodeo.owlbear.link-opener/data";
const MODAL_ID = "rodeo.owlbear.link-opener/modal";

OBR.onReady(async () => {
  await renderLinks();

  OBR.scene.items.onChange(() => {
    renderLinks();
  });

  OBR.scene.onReadyChange((isReady) => {
    if (isReady) {
      renderLinks();
    } else {
      renderEmpty("Nenhuma cena ativa no momento. Abra um mapa para ver os links.");
    }
  });
});

async function renderLinks() {
  const isReady = await OBR.scene.isReady();
  if (!isReady) {
    renderEmpty("Nenhuma cena ativa no momento. Abra um mapa para ver os links.");
    return;
  }

  const items = await OBR.scene.items.getItems();
  const linkedItems = items.filter(
    (item) => item.metadata[METADATA_KEY] && item.metadata[METADATA_KEY].url
  );

  const linksCountEl = document.getElementById("linksCount");
  const linksListEl = document.getElementById("linksList");

  if (linksCountEl) {
    linksCountEl.textContent = linkedItems.length;
  }

  if (linkedItems.length === 0) {
    renderEmpty("Nenhum token com link nesta cena.<br>Clique com botão direito em qualquer token para adicionar um link!");
    return;
  }

  linksListEl.innerHTML = "";

  for (const item of linkedItems) {
    const data = item.metadata[METADATA_KEY];
    const tokenName = item.name?.trim() || "Token sem nome";
    const displayName = data.name?.trim() || "Link";

    const card = document.createElement("div");
    card.className = "link-card";

    const info = document.createElement("div");
    info.className = "link-info";

    const nameEl = document.createElement("div");
    nameEl.className = "link-name";
    nameEl.textContent = displayName;

    const tokenEl = document.createElement("div");
    tokenEl.className = "link-token";
    tokenEl.textContent = `Em: ${tokenName}`;

    info.appendChild(nameEl);
    info.appendChild(tokenEl);

    const actions = document.createElement("div");
    actions.className = "link-actions";

    const openLink = document.createElement("a");
    openLink.className = "btn-open";
    openLink.href = data.url;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "Abrir ↗";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.type = "button";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => openEditModal(item.id));

    actions.appendChild(openLink);
    actions.appendChild(editBtn);

    card.appendChild(info);
    card.appendChild(actions);

    linksListEl.appendChild(card);
  }
}

function renderEmpty(message) {
  const linksCountEl = document.getElementById("linksCount");
  const linksListEl = document.getElementById("linksList");
  if (linksCountEl) linksCountEl.textContent = "0";
  if (linksListEl) {
    linksListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <div>${message}</div>
      </div>
    `;
  }
}

async function openEditModal(itemId) {
  const modalUrl = new URL("./modal.html", window.location.href);
  modalUrl.searchParams.set("itemId", itemId);

  await OBR.modal.open({
    id: MODAL_ID,
    url: modalUrl.href,
    width: 400,
    height: 340
  });
}
