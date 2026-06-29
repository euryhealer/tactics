function setEditorMode(enabled) {
  editorState.enabled = enabled;
  if (!enabled) {
    clearBuildingMoveState();
    editorState.selected = null;
  }
  ui.modeToggle.textContent = enabled ? "Editor: On" : "Editor: Off";
  ui.modeToggle.setAttribute("aria-pressed", String(enabled));
  ui.modeHint.textContent = enabled
    ? (profileCan("shapeElevatedTerrain")
      ? "Editor mode: click same material to stack, Shift+click to lower, click a building to move it."
      : "Editor mode: change block material and move buildings. Height editing is locked for this profile.")
    : "Play mode: choose seed packs to plant or the hand to harvest mature crops. Press I for inventory.";
  renderEditorToolUi();
  saveActiveProfileProgress();
}

function bindEditorUi() {
  bindLoginUi();
  renderProfileUi();
  renderEditorToolUi();
  renderItemUi();
  renderViewUi();
  renderMarketUi();
  ui.modeToggle.addEventListener("click", () => {
    setEditorMode(!editorState.enabled);
    game.scene.getScene("TacticsScene")?.renderScenario();
  });
  ui.blockTools.forEach((button) => {
    button.addEventListener("click", () => {
      if (!editorState.enabled) return;
      editorState.blockBrush = button.dataset.value;
      renderEditorToolUi();
      saveActiveProfileProgress();
      game.scene.getScene("TacticsScene")?.renderScenario();
    });
  });
  ui.marketToggle.addEventListener("click", () => {
    setMarketOpen(!editorState.marketOpen);
  });
  ui.inventoryClose.addEventListener("click", () => setInventoryOpen(false));
  ui.marketClose.addEventListener("click", () => setMarketOpen(false));
  ui.cameraRotate.addEventListener("click", () => {
    game.scene.getScene("TacticsScene")?.rotateView();
  });
  ui.zoomIn.addEventListener("click", () => {
    game.scene.getScene("TacticsScene")?.setZoom(editorState.zoom + ZOOM_STEP);
  });
  ui.zoomOut.addEventListener("click", () => {
    game.scene.getScene("TacticsScene")?.setZoom(editorState.zoom - ZOOM_STEP);
  });
}

function bindLoginUi() {
  renderLoginProfiles();
  const hasActiveLogin = Boolean(localStorage.getItem(ACTIVE_PROFILE_KEY));
  ui.loginScreen?.classList.toggle("hidden", hasActiveLogin);
  ui.loginButton?.addEventListener("click", () => {
    const profileId = ui.loginProfileSelect?.value;
    if (!profileId || !editorState.profiles[profileId]) {
      showLoginMessage("Choose a profile.");
      return;
    }
    enterProfile(profileId);
  });
  ui.loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    createPlayerProfileFromLogin();
  });
}

function renderLoginProfiles() {
  if (!ui.loginProfileSelect) return;
  ui.loginProfileSelect.replaceChildren();
  Object.values(editorState.profiles).forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.isMain ? `${profile.name} (GM)` : profile.name;
    ui.loginProfileSelect.append(option);
  });
  ui.loginProfileSelect.value = editorState.profiles[editorState.activeProfileId]
    ? editorState.activeProfileId
    : "GM";
}

function showLoginMessage(message) {
  if (ui.loginMessage) ui.loginMessage.textContent = message;
}

function enterProfile(profileId) {
  if (!switchActiveProfile(profileId)) {
    showLoginMessage("Profile not found.");
    return;
  }
  ui.loginScreen?.classList.add("hidden");
  showLoginMessage("");
}

function createPlayerProfileFromLogin() {
  const rawName = ui.loginProfileInput?.value.trim() || "";
  if (rawName.length < 2) {
    showLoginMessage("Use at least 2 characters.");
    return;
  }
  const profileId = makeProfileId(rawName);
  editorState.profiles[profileId] = makePlayerProfile(profileId, rawName);
  saveProfileRegistry();
  renderLoginProfiles();
  ui.loginProfileInput.value = "";
  enterProfile(profileId);
}

function renderViewUi() {
  ui.cameraAngle.textContent = `${editorState.viewRotation * 90}deg`;
}

function renderEditorToolUi() {
  ui.blockTools.forEach((tool) => {
    tool.disabled = !editorState.enabled;
    tool.classList.toggle("active", editorState.enabled && tool.dataset.value === editorState.blockBrush);
  });
}

function renderProfileUi() {
  const profile = activeProfile();
  if (!ui.profileName || !profile) return;
  ui.profileName.textContent = profile.name;
  ui.profileName.title = profile.title;
  if (ui.cameraRotate) ui.cameraRotate.disabled = !profileCan("rotateCamera");
  renderLoginProfiles();
}

function renderItemUi() {
  ui.goldAmount.textContent = String(editorState.gold);
  ui.itemToolbar.replaceChildren();
  editorState.toolbarItems.forEach((itemStack, index) => {
    const slot = createItemSlot(itemStack, "toolbar", index);
    slot.classList.toggle("active", index === editorState.selectedToolbarIndex);
    ui.itemToolbar.append(slot);
  });

  ui.inventoryGrid.replaceChildren();
  editorState.inventoryItems.forEach((itemStack, index) => {
    ui.inventoryGrid.append(createItemSlot(itemStack, "inventory", index));
  });
  renderMarketUi();
}

function renderMarketUi() {
  if (!ui.marketGrid) return;
  ui.goldAmount.textContent = String(editorState.gold);
  ui.marketGrid.replaceChildren();
  ui.marketGrid.append(createLandMarketRow());
  const buyItems = ["carrot", "wheat", "turnip"];
  const sellItems = ["carrotProduce", "wheatProduce", "turnipProduce"];
  buyItems.forEach((itemId) => {
    ui.marketGrid.append(createMarketRow(itemId, "buy"));
  });
  sellItems.forEach((itemId) => {
    ui.marketGrid.append(createMarketRow(itemId, "sell"));
  });
}

function createMarketRow(itemId, mode) {
  const item = ITEMS[itemId];
  const row = document.createElement("div");
  row.className = "market-row";
  const owned = inventoryItemCount(itemId);

  const image = document.createElement("img");
  image.src = item.icon;
  image.alt = item.label;
  row.append(image);

  const details = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = item.label;
  const price = document.createElement("small");
  price.textContent = mode === "buy" ? `Buy: ${item.buyPrice} gold` : `Owned: ${owned} | Total: ${item.sellPrice} gold`;
  details.append(name, price);
  row.append(details);

  let selectedQty = 0;
  if (mode === "sell") {
    const maxSell = owned;
    const qtyControl = createQtyStepper(maxSell, (qty) => {
      selectedQty = qty;
      price.textContent = `Owned: ${owned} | Total: ${selectedQty * item.sellPrice} gold`;
    });
    row.append(qtyControl);
  } else {
    const maxBuy = Math.min(Math.floor(editorState.gold / item.buyPrice), inventoryCapacityForItem(itemId));
    const qtyControl = createQtyStepper(maxBuy, (qty) => {
      selectedQty = qty;
      price.textContent = `Buy: ${item.buyPrice} gold | Total: ${selectedQty * item.buyPrice} gold`;
    });
    row.append(qtyControl);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = mode === "buy" ? "Buy" : "Sell";
  button.disabled = mode === "buy"
    ? selectedQty <= 0
    : owned === 0;
  button.addEventListener("click", () => {
    if (mode === "buy") buySeed(itemId, selectedQty);
    else sellProduce(itemId, selectedQty);
  });
  row.append(button);
  return row;
}

function createQtyStepper(maxQty, onChange) {
  let qty = maxQty > 0 ? 1 : 0;
  const qtyControl = document.createElement("div");
  qtyControl.className = "market-qty-stepper";

  const decrement = document.createElement("button");
  decrement.type = "button";
  decrement.className = "market-qty-button";
  decrement.textContent = "-";

  const qtyValue = document.createElement("span");
  qtyValue.className = "market-qty-value";

  const increment = document.createElement("button");
  increment.type = "button";
  increment.className = "market-qty-button";
  increment.textContent = "+";

  const updateQty = (nextQty) => {
    qty = maxQty > 0 ? Math.max(1, Math.min(maxQty, nextQty)) : 0;
    qtyValue.textContent = String(qty);
    decrement.disabled = maxQty <= 0 || qty <= 1;
    increment.disabled = maxQty <= 0 || qty >= maxQty;
    onChange(qty);
  };

  decrement.addEventListener("click", () => updateQty(qty - 1));
  increment.addEventListener("click", () => updateQty(qty + 1));
  updateQty(qty);

  qtyControl.append(decrement, qtyValue, increment);
  return qtyControl;
}

function createLandMarketRow() {
  const row = document.createElement("div");
  row.className = "market-row";

  const icon = document.createElement("div");
  icon.className = "market-land-icon";
  icon.textContent = "+";
  row.append(icon);

  const details = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = "Expand Land";
  const price = document.createElement("small");
  const cost = landExpansionCost();
  price.textContent = `Adds 1 row + 1 column | Cost: ${cost} gold`;
  details.append(name, price);
  row.append(details);

  const spacer = document.createElement("span");
  row.append(spacer);

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Buy";
  button.disabled = editorState.gold < cost;
  button.addEventListener("click", buyLandExpansion);
  row.append(button);
  return row;
}

function createItemSlot(itemStack, source, index) {
  const itemId = slotItemId(itemStack);
  const qty = slotQty(itemStack);
  const slot = document.createElement("button");
  slot.type = "button";
  slot.className = `${source}-slot${itemId ? "" : " empty"}`;
  slot.dataset.source = source;
  slot.dataset.index = String(index);
  slot.title = itemId ? ITEMS[itemId].label : "Empty";

  if (source === "toolbar") {
    const key = document.createElement("span");
    key.className = "slot-key";
    key.textContent = String(index + 1);
    slot.append(key);
  }

  if (itemId) {
    const image = document.createElement("img");
    image.src = ITEMS[itemId].icon;
    image.alt = ITEMS[itemId].label;
    slot.append(image);
    if (qty > 1) {
      const amount = document.createElement("span");
      amount.className = "slot-count";
      amount.textContent = String(qty);
      slot.append(amount);
    }
  }

  slot.addEventListener("click", () => {
    if (source === "toolbar") {
      editorState.selectedToolbarIndex = index;
      saveActiveProfileProgress();
      renderItemUi();
    }
  });

  slot.addEventListener("dblclick", () => {
    if (!itemId) return;
    if (source === "inventory") moveInventoryItemToToolbar(index);
    if (source === "toolbar" && editorState.inventoryOpen) moveToolbarItemToInventory(index);
  });

  return slot;
}

function moveInventoryItemToToolbar(inventoryIndex) {
  const itemStack = editorState.inventoryItems[inventoryIndex];
  const item = slotItemId(itemStack);
  if (!item) return;
  if (ITEMS[item]?.toolbarAllowed === false) return;
  const remaining = addItemsToSlots(editorState.toolbarItems, item, slotQty(itemStack));
  if (remaining === slotQty(itemStack)) return;
  editorState.inventoryItems[inventoryIndex] = remaining > 0 ? makeStack(item, remaining) : null;
  const toolbarIndex = editorState.toolbarItems.findIndex((slot) => slotItemId(slot) === item);
  editorState.selectedToolbarIndex = toolbarIndex;
  saveActiveProfileProgress();
  renderItemUi();
}

function moveToolbarItemToInventory(toolbarIndex) {
  const itemStack = editorState.toolbarItems[toolbarIndex];
  const item = slotItemId(itemStack);
  if (!item) return;
  if (ITEMS[item]?.toolbarOnly) return;
  const remaining = addItemsToSlots(editorState.inventoryItems, item, slotQty(itemStack));
  if (remaining === slotQty(itemStack)) return;
  editorState.toolbarItems[toolbarIndex] = remaining > 0 ? makeStack(item, remaining) : null;
  if (editorState.selectedToolbarIndex === toolbarIndex) {
    const next = editorState.toolbarItems.findIndex((slot) => slotItemId(slot) !== null);
    editorState.selectedToolbarIndex = next === -1 ? 0 : next;
  }
  saveActiveProfileProgress();
  renderItemUi();
}

function consumeToolbarItem(toolbarIndex) {
  const itemStack = editorState.toolbarItems[toolbarIndex];
  const item = slotItemId(itemStack);
  if (!item || ITEMS[item]?.toolbarOnly) return;
  itemStack.qty -= 1;
  if (itemStack.qty <= 0) {
    editorState.toolbarItems[toolbarIndex] = null;
    const next = editorState.toolbarItems.findIndex((slot) => slotItemId(slot) !== null);
    editorState.selectedToolbarIndex = next === -1 ? 0 : next;
  }
  saveActiveProfileProgress();
  renderItemUi();
}

function addInventoryItem(itemId) {
  if (!ITEMS[itemId]) return false;
  return addItemsToSlots(editorState.inventoryItems, itemId, 1) === 0;
}

function addItemsToSlots(slots, itemId, qty) {
  let remaining = qty;
  for (const slot of slots) {
    if (remaining <= 0) break;
    if (slotItemId(slot) !== itemId || slotQty(slot) >= MAX_STACK) continue;
    const add = Math.min(MAX_STACK - slot.qty, remaining);
    slot.qty += add;
    remaining -= add;
  }
  for (let i = 0; i < slots.length && remaining > 0; i += 1) {
    if (slots[i] !== null) continue;
    const add = Math.min(MAX_STACK, remaining);
    slots[i] = makeStack(itemId, add);
    remaining -= add;
  }
  return remaining;
}

function hasInventorySpace(itemId = null) {
  if (itemId && editorState.inventoryItems.some((slot) => slotItemId(slot) === itemId && slotQty(slot) < MAX_STACK)) {
    return true;
  }
  return editorState.inventoryItems.some((slot) => slot === null);
}

function inventoryCapacityForItem(itemId) {
  return editorState.inventoryItems.reduce((capacity, slot) => {
    if (slot === null) return capacity + MAX_STACK;
    if (slotItemId(slot) === itemId) return capacity + Math.max(0, MAX_STACK - slotQty(slot));
    return capacity;
  }, 0);
}

function buySeed(itemId, qty = 1) {
  const item = ITEMS[itemId];
  if (!item || item.type !== "seed") return;
  const buyQty = Math.floor(qty);
  if (buyQty <= 0) return;
  const totalCost = item.buyPrice * buyQty;
  if (editorState.gold < totalCost || inventoryCapacityForItem(itemId) < buyQty) return;
  const remaining = addItemsToSlots(editorState.inventoryItems, itemId, buyQty);
  if (remaining > 0) return;
  editorState.gold -= totalCost;
  saveActiveProfileProgress();
  renderItemUi();
}

function sellProduce(itemId, qty = 1) {
  const item = ITEMS[itemId];
  if (!item || item.type !== "produce") return;
  let remaining = Math.min(qty, inventoryItemCount(itemId));
  if (remaining <= 0) return;
  const sold = remaining;
  for (let i = 0; i < editorState.inventoryItems.length && remaining > 0; i += 1) {
    const slot = editorState.inventoryItems[i];
    if (slotItemId(slot) !== itemId) continue;
    const remove = Math.min(slot.qty, remaining);
    slot.qty -= remove;
    remaining -= remove;
    if (slot.qty <= 0) editorState.inventoryItems[i] = null;
  }
  editorState.gold += item.sellPrice * sold;
  saveActiveProfileProgress();
  renderItemUi();
}

function landExpansionCost() {
  return LAND_BASE_PRICE + editorState.landExpansions * LAND_PRICE_STEP;
}

function buyLandExpansion() {
  const cost = landExpansionCost();
  if (editorState.gold < cost) return;
  editorState.gold -= cost;
  editorState.landExpansions += 1;
  expandTerrain();
  saveActiveProfileProgress();
  renderItemUi();
  game.scene.getScene("TacticsScene")?.renderScenario();
}

function expandTerrain() {
  const oldWidth = mapWidth();
  const oldHeight = mapHeight();
  for (let y = 0; y < oldHeight; y += 1) {
    terrainGrid[y].push(createExpansionCell(oldWidth, y));
  }
  const row = [];
  for (let x = 0; x <= oldWidth; x += 1) {
    row.push(createExpansionCell(x, oldHeight));
  }
  terrainGrid.push(row);
}

function createExpansionCell(x, y) {
  return {
    x,
    y,
    type: "grass",
    height: 1,
    crop: null,
  };
}

function inventoryItemCount(itemId) {
  return editorState.inventoryItems.reduce((total, slot) => (
    slotItemId(slot) === itemId ? total + slotQty(slot) : total
  ), 0);
}

function setInventoryOpen(open) {
  if (open) setMarketOpen(false);
  editorState.inventoryOpen = open;
  ui.inventoryPanel.classList.toggle("hidden", !open);
}

function setMarketOpen(open) {
  if (open) setInventoryOpen(false);
  editorState.marketOpen = open;
  ui.marketPanel.classList.toggle("hidden", !open);
  renderMarketUi();
}

function closePanels() {
  editorState.inventoryOpen = false;
  editorState.marketOpen = false;
  ui.inventoryPanel.classList.add("hidden");
  ui.marketPanel.classList.add("hidden");
}

