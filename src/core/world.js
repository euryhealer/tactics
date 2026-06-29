function parseCell(raw, x, y) {
  const [type, height] = raw.split(":");
  return {
    x,
    y,
    type,
    height: Number(height),
    crop: null,
  };
}

function makeInitialGrid() {
  const grid = INITIAL_MAP.map((row, y) => row.map((raw, x) => parseCell(raw, x, y)));
  applyInitialFootprint(grid, INITIAL_HOUSE, HOUSE_FOOTPRINT);
  applyInitialFootprint(grid, INITIAL_BARN, BARN_FOOTPRINT);
  return grid;
}

function applyInitialFootprint(grid, origin, footprint) {
  for (let y = origin.y; y < origin.y + footprint.height; y += 1) {
    for (let x = origin.x; x < origin.x + footprint.width; x += 1) {
      const cell = grid[y]?.[x];
      if (!cell) continue;
      cell.type = "grass";
      cell.height = footprint.baseHeight;
      cell.crop = null;
    }
  }
}

function mapWidth() {
  return terrainGrid[0]?.length ?? INITIAL_MAP[0].length;
}

function mapHeight() {
  return terrainGrid.length || INITIAL_MAP.length;
}

function viewDimensions() {
  return editorState.viewRotation % 2 === 0
    ? { width: mapWidth(), height: mapHeight() }
    : { width: mapHeight(), height: mapWidth() };
}

function cellToView(cell) {
  const width = mapWidth();
  const height = mapHeight();
  switch (editorState.viewRotation) {
    case 1:
      return { x: height - 1 - cell.y, y: cell.x };
    case 2:
      return { x: width - 1 - cell.x, y: height - 1 - cell.y };
    case 3:
      return { x: cell.y, y: width - 1 - cell.x };
    default:
      return { x: cell.x, y: cell.y };
  }
}

function viewToCellCoords(viewX, viewY) {
  const width = mapWidth();
  const height = mapHeight();
  switch (editorState.viewRotation) {
    case 1:
      return { x: viewY, y: height - 1 - viewX };
    case 2:
      return { x: width - 1 - viewX, y: height - 1 - viewY };
    case 3:
      return { x: width - 1 - viewY, y: viewX };
    default:
      return { x: viewX, y: viewY };
  }
}

function isoToScreen(x, y, height = 0) {
  const dims = viewDimensions();
  const centerOffsetX = ((dims.height - dims.width) * TILE_W) / 4;
  return {
    x: ORIGIN_X + centerOffsetX + (x - y) * (TILE_W / 2),
    y: ORIGIN_Y + (x + y) * (TILE_H / 2) - height * BLOCK_H,
  };
}

function cellToScreen(cell) {
  return cellToScreenAtHeight(cell, displayHeight(cell));
}

function cellToScreenAtHeight(cell, height) {
  const view = cellToView(cell);
  return isoToScreen(view.x, view.y, height);
}

function displayHeight(cell) {
  if (isHouseTile(cell)) return Math.max(cell.height, HOUSE_FOOTPRINT.baseHeight);
  if (isBarnTile(cell)) return Math.max(cell.height, BARN_FOOTPRINT.baseHeight);
  return cell.height;
}

function visibleHeight(cell) {
  return isBuildingTile(cell) ? Math.min(cell.height, 1) : cell.height;
}

let terrainGrid = makeInitialGrid();

function pointerToTile(worldX, worldY) {
  let best = null;
  let bestScore = Infinity;
  for (const row of terrainGrid) {
    for (const cell of row) {
      const pos = cellToScreen(cell);
      const dx = Math.abs(worldX - pos.x) / (TILE_W / 2);
      const dy = Math.abs(worldY - pos.y) / (TILE_H / 2);
      const score = dx + dy;
      if (score < 1.05 && score < bestScore) {
        best = cell;
        bestScore = score;
      }
    }
  }
  return best;
}

function getCell(x, y) {
  return terrainGrid[y]?.[x] ?? null;
}

function isWalkable(cell) {
  return Boolean(cell && cell.type !== "water" && !isBuildingTile(cell));
}

function isPlayerAt(cell) {
  return editorState.player.x === cell.x && editorState.player.y === cell.y;
}

function activeProfile() {
  return editorState.profiles[editorState.activeProfileId] ?? editorState.profiles.GM ?? null;
}

function profileCan(permission) {
  return Boolean(activeProfile()?.permissions?.[permission]);
}

function activeProfileStorageKey() {
  return `tactics.profile.${editorState.activeProfileId}.v${SAVE_VERSION}`;
}

function resetProfileRuntimeState() {
  clearBuildingMoveState();
  terrainGrid = makeInitialGrid();
  editorState.enabled = false;
  editorState.blockBrush = "grass";
  editorState.selected = null;
  editorState.selectedToolbarIndex = 1;
  editorState.inventoryOpen = false;
  editorState.marketOpen = false;
  editorState.interiors = makeDefaultInteriors();
  editorState.gold = 24;
  editorState.landExpansions = 0;
  editorState.viewRotation = 0;
  editorState.zoom = 1;
  editorState.cameraPan.x = 0;
  editorState.cameraPan.y = 0;
  editorState.interiorCameraPan.x = 0;
  editorState.interiorCameraPan.y = 0;
  editorState.house.x = INITIAL_HOUSE.x;
  editorState.house.y = INITIAL_HOUSE.y;
  editorState.house.width = HOUSE_FOOTPRINT.width;
  editorState.house.height = HOUSE_FOOTPRINT.height;
  editorState.barn.x = INITIAL_BARN.x;
  editorState.barn.y = INITIAL_BARN.y;
  editorState.barn.width = BARN_FOOTPRINT.width;
  editorState.barn.height = BARN_FOOTPRINT.height;
  editorState.player.x = 1;
  editorState.player.y = 1;
  editorState.player.moving = false;
  editorState.player.path = [];
  editorState.toolbarItems = [makeStack("harvestHand"), makeStack("carrot"), null, null, null];
  editorState.inventoryItems = [makeStack("wheat"), makeStack("turnip"), null, null, null, null, null, null, null, null];
}

function switchActiveProfile(profileId) {
  if (!editorState.profiles[profileId]) return false;
  saveActiveProfileProgress();
  editorState.activeProfileId = profileId;
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  resetProfileRuntimeState();
  loadActiveProfileProgress();
  setInventoryOpen(false);
  setMarketOpen(false);
  renderProfileUi();
  renderEditorToolUi();
  renderViewUi();
  renderItemUi();
  game.scene.getScene("TacticsScene")?.renderScenario();
  return true;
}

function currentSceneTime() {
  return game?.scene?.getScene("TacticsScene")?.time?.now ?? 0;
}

function serializeCell(cell) {
  return {
    x: cell.x,
    y: cell.y,
    type: cell.type,
    height: cell.height,
    crop: cell.crop
      ? {
        type: cell.crop.type,
        elapsedMs: Math.max(0, currentSceneTime() - cell.crop.startedAt),
      }
      : null,
  };
}

function serializeSlot(slot) {
  const id = slotItemId(slot);
  return id ? makeStack(id, slotQty(slot)) : null;
}

function serializeInteriors() {
  return Object.fromEntries(
    Object.entries(editorState.interiors).map(([interiorId, interior]) => [
      interiorId,
      {
        items: Object.fromEntries(
          Object.entries(interior.items).map(([itemId, item]) => [
            itemId,
            { x: item.x, y: item.y },
          ]),
        ),
      },
    ]),
  );
}

function saveActiveProfileProgress() {
  if (!window.localStorage) return;
  const payload = {
    version: SAVE_VERSION,
    activeProfileId: editorState.activeProfileId,
    savedAt: Date.now(),
    gold: editorState.gold,
    landExpansions: editorState.landExpansions,
    viewRotation: editorState.viewRotation,
    zoom: editorState.zoom,
    cameraPan: { ...editorState.cameraPan },
    interiorCameraPan: { ...editorState.interiorCameraPan },
    blockBrush: editorState.blockBrush,
    selectedToolbarIndex: editorState.selectedToolbarIndex,
    house: { ...editorState.house },
    barn: { ...editorState.barn },
    interiors: serializeInteriors(),
    player: {
      x: editorState.player.x,
      y: editorState.player.y,
    },
    toolbarItems: editorState.toolbarItems.map(serializeSlot),
    inventoryItems: editorState.inventoryItems.map(serializeSlot),
    terrainGrid: terrainGrid.map((row) => row.map(serializeCell)),
  };
  localStorage.setItem(activeProfileStorageKey(), JSON.stringify(payload));
}

function restoreCell(saved) {
  if (!saved || typeof saved.x !== "number" || typeof saved.y !== "number" || !BLOCKS[saved.type]) return null;
  return {
    x: saved.x,
    y: saved.y,
    type: saved.type,
    height: Number.isFinite(saved.height) ? saved.height : 1,
    crop: saved.crop?.type && CROPS[saved.crop.type]
      ? {
        type: saved.crop.type,
        startedAt: -Math.max(0, Number(saved.crop.elapsedMs) || 0),
      }
      : null,
  };
}

function restoreSlots(savedSlots, fallbackSlots) {
  if (!Array.isArray(savedSlots)) return fallbackSlots;
  return fallbackSlots.map((fallback, index) => {
    const saved = savedSlots[index];
    const id = slotItemId(saved);
    if (!id || !ITEMS[id]) return null;
    const qty = Math.max(1, Math.min(MAX_STACK, slotQty(saved)));
    return makeStack(id, qty);
  });
}

function restoreInteriors(savedInteriors) {
  const restored = makeDefaultInteriors();
  if (!savedInteriors || typeof savedInteriors !== "object") return restored;
  for (const [interiorId, interior] of Object.entries(restored)) {
    const savedItems = savedInteriors[interiorId]?.items;
    if (!savedItems || typeof savedItems !== "object") continue;
    for (const [itemId, item] of Object.entries(interior.items)) {
      const savedItem = savedItems[itemId];
      if (!savedItem || typeof savedItem !== "object") continue;
      item.x = Number.isFinite(savedItem.x) ? savedItem.x : item.x;
      item.y = Number.isFinite(savedItem.y) ? savedItem.y : item.y;
    }
  }
  return restored;
}

function loadActiveProfileProgress() {
  if (!window.localStorage) return;
  const raw = localStorage.getItem(activeProfileStorageKey());
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (saved?.version !== SAVE_VERSION || saved.activeProfileId !== editorState.activeProfileId) return;
    editorState.gold = Number.isFinite(saved.gold) ? saved.gold : editorState.gold;
    editorState.landExpansions = Number.isFinite(saved.landExpansions) ? saved.landExpansions : editorState.landExpansions;
    editorState.viewRotation = Number.isInteger(saved.viewRotation) ? Phaser.Math.Wrap(saved.viewRotation, 0, 4) : editorState.viewRotation;
    editorState.zoom = Number.isFinite(saved.zoom) ? Phaser.Math.Clamp(saved.zoom, ZOOM_MIN, ZOOM_MAX) : editorState.zoom;
    editorState.cameraPan.x = Number.isFinite(saved.cameraPan?.x) ? saved.cameraPan.x : editorState.cameraPan.x;
    editorState.cameraPan.y = Number.isFinite(saved.cameraPan?.y) ? saved.cameraPan.y : editorState.cameraPan.y;
    editorState.interiorCameraPan.x = Number.isFinite(saved.interiorCameraPan?.x) ? saved.interiorCameraPan.x : editorState.interiorCameraPan.x;
    editorState.interiorCameraPan.y = Number.isFinite(saved.interiorCameraPan?.y) ? saved.interiorCameraPan.y : editorState.interiorCameraPan.y;
    editorState.blockBrush = BLOCKS[saved.blockBrush] ? saved.blockBrush : editorState.blockBrush;
    editorState.selectedToolbarIndex = Number.isInteger(saved.selectedToolbarIndex)
      ? Phaser.Math.Clamp(saved.selectedToolbarIndex, 0, editorState.toolbarItems.length - 1)
      : editorState.selectedToolbarIndex;
    editorState.house = { ...editorState.house, ...saved.house };
    editorState.barn = { ...editorState.barn, ...saved.barn };
    editorState.interiors = restoreInteriors(saved.interiors);
    editorState.player.x = Number.isFinite(saved.player?.x) ? saved.player.x : editorState.player.x;
    editorState.player.y = Number.isFinite(saved.player?.y) ? saved.player.y : editorState.player.y;
    editorState.toolbarItems = restoreSlots(saved.toolbarItems, editorState.toolbarItems);
    editorState.inventoryItems = restoreSlots(saved.inventoryItems, editorState.inventoryItems);
    if (Array.isArray(saved.terrainGrid) && saved.terrainGrid.length > 0) {
      const restoredGrid = saved.terrainGrid.map((row) => (
        Array.isArray(row) ? row.map(restoreCell).filter(Boolean) : []
      )).filter((row) => row.length > 0);
      if (restoredGrid.length > 0) terrainGrid = restoredGrid;
    }
  } catch (error) {
    console.warn("Could not load saved GM profile progress.", error);
  }
}

function isHouseTile(cell) {
  const house = editorState.house;
  return Boolean(
    cell
      && cell.x >= house.x
      && cell.x < house.x + house.width
      && cell.y >= house.y
      && cell.y < house.y + house.height,
  );
}

function isBarnTile(cell) {
  const barn = editorState.barn;
  return Boolean(
    cell
      && cell.x >= barn.x
      && cell.x < barn.x + barn.width
      && cell.y >= barn.y
      && cell.y < barn.y + barn.height,
  );
}

function isBuildingTile(cell) {
  return isHouseTile(cell) || isBarnTile(cell);
}

function isHouseAnchor(cell) {
  return Boolean(cell && cell.x === editorState.house.x && cell.y === editorState.house.y);
}

function isBarnAnchor(cell) {
  return Boolean(cell && cell.x === editorState.barn.x && cell.y === editorState.barn.y);
}

function houseFootprintCells() {
  const house = editorState.house;
  const cells = [];
  for (let y = house.y; y < house.y + house.height; y += 1) {
    for (let x = house.x; x < house.x + house.width; x += 1) {
      const cell = getCell(x, y);
      if (cell) cells.push(cell);
    }
  }
  return cells;
}

function barnFootprintCells() {
  const barn = editorState.barn;
  const cells = [];
  for (let y = barn.y; y < barn.y + barn.height; y += 1) {
    for (let x = barn.x; x < barn.x + barn.width; x += 1) {
      const cell = getCell(x, y);
      if (cell) cells.push(cell);
    }
  }
  return cells;
}

function canPlaceHouseAt(x, y) {
  for (let yy = y; yy < y + editorState.house.height; yy += 1) {
    for (let xx = x; xx < x + editorState.house.width; xx += 1) {
      const cell = getCell(xx, yy);
      if (!cell || cell.type === "water" || cell.crop || isPlayerAt(cell) || isBarnTile(cell)) return false;
    }
  }
  return true;
}

function canPlaceBarnAt(x, y) {
  for (let yy = y; yy < y + editorState.barn.height; yy += 1) {
    for (let xx = x; xx < x + editorState.barn.width; xx += 1) {
      const cell = getCell(xx, yy);
      if (!cell || cell.type === "water" || cell.crop || isPlayerAt(cell) || isHouseTile(cell)) return false;
    }
  }
  return true;
}

function northAnchorOffset(building) {
  return {
    x: Math.floor((building.width - 1) / 2),
    y: 0,
  };
}

function originFromNorthAnchor(anchorX, anchorY, building) {
  const anchor = northAnchorOffset(building);
  return {
    x: anchorX - anchor.x,
    y: anchorY - anchor.y,
  };
}

function moveHouseTo(x, y) {
  if (!canPlaceHouseAt(x, y)) return false;
  clearFootprintElevation(houseFootprintCells());
  editorState.house.x = x;
  editorState.house.y = y;
  normalizeHouseFootprint();
  clearBuildingMoveState();
  editorState.selected = null;
  saveActiveProfileProgress();
  return true;
}

function moveHouseFromNorthAnchor(anchorX, anchorY) {
  const origin = originFromNorthAnchor(anchorX, anchorY, editorState.house);
  return moveHouseTo(origin.x, origin.y);
}

function moveBarnTo(x, y) {
  if (!canPlaceBarnAt(x, y)) return false;
  clearFootprintElevation(barnFootprintCells());
  editorState.barn.x = x;
  editorState.barn.y = y;
  normalizeBarnFootprint();
  clearBuildingMoveState();
  editorState.selected = null;
  saveActiveProfileProgress();
  return true;
}

function moveBarnFromNorthAnchor(anchorX, anchorY) {
  const origin = originFromNorthAnchor(anchorX, anchorY, editorState.barn);
  return moveBarnTo(origin.x, origin.y);
}

function buildingMoveConfig(type) {
  if (type === "house") {
    return {
      state: editorState.house,
      footprint: HOUSE_FOOTPRINT,
      texture: "house",
      canPlace: canPlaceHouseAt,
      moveFromAnchor: moveHouseFromNorthAnchor,
    };
  }
  if (type === "barn") {
    return {
      state: editorState.barn,
      footprint: BARN_FOOTPRINT,
      texture: "barn",
      canPlace: canPlaceBarnAt,
      moveFromAnchor: moveBarnFromNorthAnchor,
    };
  }
  return null;
}

function updateBuildingPreview(type, anchorX, anchorY) {
  const config = buildingMoveConfig(type);
  if (!config) return null;
  const origin = originFromNorthAnchor(anchorX, anchorY, config.state);
  const valid = config.canPlace(origin.x, origin.y);
  editorState.buildingPreview = {
    type,
    anchorX,
    anchorY,
    originX: origin.x,
    originY: origin.y,
    valid,
  };
  return editorState.buildingPreview;
}

function clearBuildingMoveState() {
  editorState.houseMoving = false;
  editorState.barnMoving = false;
  editorState.buildingPreview = null;
}

function normalizeHouseFootprint() {
  for (const cell of houseFootprintCells()) {
    cell.type = "grass";
    cell.height = HOUSE_FOOTPRINT.baseHeight;
    cell.crop = null;
  }
}

function clearFootprintElevation(cells) {
  for (const cell of cells) {
    cell.type = "grass";
    cell.height = 1;
    cell.crop = null;
  }
}

function normalizeBarnFootprint() {
  for (const cell of barnFootprintCells()) {
    cell.type = "grass";
    cell.height = BARN_FOOTPRINT.baseHeight;
    cell.crop = null;
  }
}

function buildTilePath(fromX, fromY, toX, toY) {
  const path = [];
  let x = fromX;
  let y = fromY;
  while (x !== toX) {
    x += Math.sign(toX - x);
    const cell = getCell(x, y);
    if (!isWalkable(cell)) return [];
    path.push(cell);
  }
  while (y !== toY) {
    y += Math.sign(toY - y);
    const cell = getCell(x, y);
    if (!isWalkable(cell)) return [];
    path.push(cell);
  }
  return path;
}

