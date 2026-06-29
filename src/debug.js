window.__tacticsDebug = {
  getGrid: () => terrainGrid,
  getEditor: () => editorState,
  getProfile: () => activeProfile(),
  save: () => saveActiveProfileProgress(),
  storageKey: () => activeProfileStorageKey(),
  getNow: () => game.scene.getScene("TacticsScene").time.now,
  select: (x, y) => {
    const cell = terrainGrid[y]?.[x];
    editorState.selected = cell?.type === "soil" && !isBuildingTile(cell) ? { x, y } : null;
    game.scene.getScene("TacticsScene").renderScenario();
    return editorState.selected;
  },
  plant: (x, y, crop = "carrot") => {
    const cell = terrainGrid[y]?.[x];
    if (!cell || cell.type !== "soil" || isBuildingTile(cell)) return false;
    cell.crop = { type: crop, startedAt: game.scene.getScene("TacticsScene").time.now };
    game.scene.getScene("TacticsScene").renderScenario();
    return true;
  },
  harvest: (x, y) => {
    const cell = terrainGrid[y]?.[x];
    if (!cell || cell.type !== "soil") return false;
    const scene = game.scene.getScene("TacticsScene");
    scene.harvestCrop(cell);
    scene.renderScenario();
    return true;
  },
  plantTree: (x, y, tree = "appleTree") => {
    const cell = terrainGrid[y]?.[x];
    if (!cell || cell.type !== "grass" || isBuildingTile(cell) || !TREE_TYPES[tree]) return false;
    cell.tree = {
      type: tree,
      plantedAt: game.scene.getScene("TacticsScene").time.now,
      lastHarvestAt: null,
    };
    game.scene.getScene("TacticsScene").renderScenario();
    return true;
  },
  harvestTree: (x, y) => {
    const cell = terrainGrid[y]?.[x];
    if (!cell || !cell.tree) return false;
    const scene = game.scene.getScene("TacticsScene");
    scene.harvestTree(cell);
    scene.renderScenario();
    return true;
  },
  setEditor: (enabled) => {
    setEditorMode(enabled);
    game.scene.getScene("TacticsScene").renderScenario();
  },
  enterHouse: () => {
    game.scene.getScene("TacticsScene").scene.start("HouseInteriorScene");
  },
  moveHouse: (x, y) => {
    const moved = moveHouseTo(x, y);
    game.scene.getScene("TacticsScene").renderScenario();
    return moved;
  },
  moveHouseFromNorthAnchor: (x, y) => {
    const moved = moveHouseFromNorthAnchor(x, y);
    game.scene.getScene("TacticsScene").renderScenario();
    return moved;
  },
  moveBarn: (x, y) => {
    const moved = moveBarnTo(x, y);
    game.scene.getScene("TacticsScene").renderScenario();
    return moved;
  },
  moveBarnFromNorthAnchor: (x, y) => {
    const moved = moveBarnFromNorthAnchor(x, y);
    game.scene.getScene("TacticsScene").renderScenario();
    return moved;
  },
  paint: (x, y, type, lower = false) => {
    const cell = terrainGrid[y]?.[x];
    if (!cell || !BLOCKS[type]) return false;
    editorState.blockBrush = type;
    const scene = game.scene.getScene("TacticsScene");
    scene.paintBlock(cell, lower);
    scene.renderScenario();
    return true;
  },
};

