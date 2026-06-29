class TacticsScene extends Phaser.Scene {
  constructor() {
    super("TacticsScene");
    this.statusText = null;
    this.lastRenderSecond = -1;
  }

  preload() {
    this.load.image("grassTop", "assets/grass-top.png");
    this.load.image("waterTop", "assets/water-top.png");
    this.load.image("soilTop", "assets/soil-top.png");
    this.load.image("house", "assets/buildings/house.png");
    this.load.image("barn", "assets/buildings/barn.png");
    for (const [cropId, crop] of Object.entries(CROPS)) {
      this.load.image(crop.seedTexture, `assets/crops/${cropId}-seed.png`);
      crop.stages.forEach((texture, index) => {
        this.load.image(texture, `assets/crops/${cropId}-stage-${index + 1}.png`);
      });
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#16242c");
    this.applyZoom();
    this.sampleTexturePalettes();
    this.createTopWrapTextures();
    this.renderScenario();
    this.createInput();
    this.time.addEvent({ delay: 5000, loop: true, callback: saveActiveProfileProgress });
  }

  sampleTexturePalettes() {
    this.texturePalettes = {};
    for (const [type, block] of Object.entries(BLOCKS)) {
      const source = this.textures.get(block.texture).getSourceImage();
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(source, 0, 0);
      const samples = [];
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < 22; i += 1) {
        const sx = (i * 37 + 19) % canvas.width;
        const sy = (i * 53 + 31) % canvas.height;
        const index = (sy * canvas.width + sx) * 4;
        samples.push(Phaser.Display.Color.GetColor(imageData[index], imageData[index + 1], imageData[index + 2]));
      }
      this.texturePalettes[type] = samples;
    }
  }

  createTopWrapTextures() {
    for (const [type, block] of Object.entries(BLOCKS)) {
      if (this.textures.exists(`${type}TopWrap`)) continue;
      const source = this.textures.get(block.texture).getSourceImage();
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = source.width;
      sourceCanvas.height = source.height;
      const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
      sourceCtx.drawImage(source, 0, 0);
      const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;

      const canvas = document.createElement("canvas");
      canvas.width = TILE_W;
      canvas.height = TILE_H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const imageData = ctx.createImageData(TILE_W, TILE_H);
      const data = imageData.data;

      for (let y = 0; y < TILE_H; y += 1) {
        for (let x = 0; x < TILE_W; x += 1) {
          const dx = (x - TILE_W / 2) / (TILE_W / 2);
          const dy = (y - TILE_H / 2) / (TILE_H / 2);
          const u = (dx + dy + 1) / 2;
          const v = (dy + 1 - dx) / 2;
          if (u < 0 || u > 1 || v < 0 || v > 1) continue;

          const sx = Math.min(sourceCanvas.width - 1, Math.max(0, Math.round(u * (sourceCanvas.width - 1))));
          const sy = Math.min(sourceCanvas.height - 1, Math.max(0, Math.round(v * (sourceCanvas.height - 1))));
          const sourceIndex = (sy * sourceCanvas.width + sx) * 4;
          const destIndex = (y * TILE_W + x) * 4;
          data[destIndex] = sourceData[sourceIndex];
          data[destIndex + 1] = sourceData[sourceIndex + 1];
          data[destIndex + 2] = sourceData[sourceIndex + 2];
          data[destIndex + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      this.textures.addCanvas(`${type}TopWrap`, canvas);
    }
  }

  update(time) {
    const second = Math.floor(time / 1000);
    if (second !== this.lastRenderSecond && this.hasGrowingCrops()) {
      this.lastRenderSecond = second;
      this.renderScenario();
    }
  }

  renderScenario() {
    this.children.removeAll();
    this.drawBackdrop();
    this.renderWaterPlane();

    const drawList = [];
    for (const row of terrainGrid) {
      for (const cell of row) drawList.push(cell);
    }
    drawList.sort((a, b) => {
      const av = cellToView(a);
      const bv = cellToView(b);
      return (av.x + av.y) * 100 + displayHeight(a) * 8 - ((bv.x + bv.y) * 100 + displayHeight(b) * 8);
    });
    for (const cell of drawList) this.drawBlock(cell);

    this.drawBuildings();
    this.drawPlayer();
    this.drawSelectedPlotBorder();
    this.drawHud();
  }

  drawBackdrop() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x24353f, 0x24353f, 0x10171c, 0x10171c, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
    g.fillStyle(0x0b1115, 0.45);
    g.fillEllipse(580, 545, 820, 220);
  }

  renderWaterPlane() {
    const g = this.add.graphics();
    g.fillStyle(0x102a49, 0.32);
    g.fillEllipse(590, 380, 760, 300);
  }

  drawBlock(cell) {
    const pos = isBuildingTile(cell) ? cellToScreenAtHeight(cell, visibleHeight(cell)) : cellToScreen(cell);
    const renderType = isBuildingTile(cell) ? "grass" : cell.type;
    const renderHeight = visibleHeight(cell);
    const style = BLOCKS[renderType];
    const g = this.add.graphics();
    const left = pos.x - TILE_W / 2;
    const right = pos.x + TILE_W / 2;
    const top = pos.y - TILE_H / 2;
    const mid = pos.y;
    const bottom = pos.y + TILE_H / 2;
    const base = bottom + renderHeight * BLOCK_H;

    if (renderHeight > 0) {
      g.fillStyle(style.left, 1);
      g.fillPoints([{ x: left, y: mid }, { x: pos.x, y: bottom }, { x: pos.x, y: base }, { x: left, y: base - TILE_H / 2 }], true);
      g.fillStyle(style.right, 1);
      g.fillPoints([{ x: right, y: mid }, { x: pos.x, y: bottom }, { x: pos.x, y: base }, { x: right, y: base - TILE_H / 2 }], true);
    }

    g.fillStyle(style.top, 1);
    g.fillPoints([{ x: pos.x, y: top }, { x: right, y: mid }, { x: pos.x, y: bottom }, { x: left, y: mid }], true);

    const texture = this.add.image(pos.x, pos.y, `${renderType}TopWrap`);
    texture.setAlpha(renderType === "water" ? 0.82 : 0.9);

    const overlay = this.add.graphics();
    overlay.fillStyle(style.topLight, 0.15);
    overlay.fillPoints([{ x: pos.x, y: top + 5 }, { x: right - 14, y: mid }, { x: pos.x, y: bottom - 7 }, { x: left + 14, y: mid }], true);

    overlay.lineStyle(2, 0xd8e0dc, 0.28);
    overlay.strokePoints([{ x: pos.x, y: top }, { x: right, y: mid }, { x: pos.x, y: bottom }, { x: left, y: mid }, { x: pos.x, y: top }], false);

    if (cell.crop && !isBuildingTile(cell)) this.drawCrop(cell, pos);
    if (editorState.enabled) this.drawEditorOverlay(cell, pos);
  }

  drawBuildings() {
    const buildings = [
      {
        type: "house",
        footprint: houseFootprintCells(),
        config: HOUSE_FOOTPRINT,
        texture: "house",
        moving: editorState.houseMoving,
      },
      {
        type: "barn",
        footprint: barnFootprintCells(),
        config: BARN_FOOTPRINT,
        texture: "barn",
        moving: editorState.barnMoving,
      },
    ];
    buildings.sort((a, b) => this.buildingDepth(a.footprint) - this.buildingDepth(b.footprint));
    for (const building of buildings) {
      if (building.moving && editorState.buildingPreview?.type === building.type) continue;
      this.drawBuildingSprite(building.footprint, building.config, building.texture, building.moving);
    }
    this.drawBuildingPreview();
  }

  drawHouse() {
    this.drawBuildingSprite(houseFootprintCells(), HOUSE_FOOTPRINT, "house", editorState.houseMoving);
  }

  drawBarn() {
    this.drawBuildingSprite(barnFootprintCells(), BARN_FOOTPRINT, "barn", editorState.barnMoving);
  }

  buildingDepth(footprint) {
    return footprint.reduce((depth, cell) => {
      const view = cellToView(cell);
      return Math.max(depth, (view.x + view.y) * 100 + displayHeight(cell) * 8);
    }, -Infinity);
  }

  drawBuildingSprite(footprint, footprintConfig, textureKey, moving, alpha = 1) {
    if (footprint.length === 0) return;
    const topPoints = footprint.flatMap((cell) => {
      const pos = cellToScreenAtHeight(cell, visibleHeight(cell));
      return [
        { x: pos.x, y: pos.y - TILE_H / 2 },
        { x: pos.x + TILE_W / 2, y: pos.y },
        { x: pos.x, y: pos.y + TILE_H / 2 },
        { x: pos.x - TILE_W / 2, y: pos.y },
      ];
    });
    const minX = Math.min(...topPoints.map((point) => point.x));
    const maxX = Math.max(...topPoints.map((point) => point.x));
    const minY = Math.min(...topPoints.map((point) => point.y));
    const maxY = Math.max(...topPoints.map((point) => point.y));
    const cx = (minX + maxX) / 2;
    const baseY = (minY + maxY) / 2;
    const sprite = this.add.image(
      cx + footprintConfig.spriteOffsetX,
      baseY + footprintConfig.spriteYOffset,
      textureKey,
    );
    sprite.setOrigin(0.5, 1);
    sprite.setScale(footprintConfig.spriteScale);
    sprite.setAlpha(alpha);
    if (moving) {
      for (const cell of footprint) {
        this.drawSelectionBorder(cell, cellToScreenAtHeight(cell, visibleHeight(cell)));
      }
    }
  }

  drawBuildingPreview() {
    const preview = editorState.buildingPreview;
    if (!preview) return;
    const config = buildingMoveConfig(preview.type);
    if (!config) return;
    const cells = this.footprintCellsAt(preview.originX, preview.originY, config.state.width, config.state.height);
    const color = preview.valid ? 0x59e77a : 0xff4f4f;
    for (const cell of cells) {
      this.drawPlacementOverlay(cell, color);
    }
    this.drawBuildingSprite(cells, config.footprint, config.texture, false, preview.valid ? 0.72 : 0.45);
  }

  footprintCellsAt(originX, originY, width, height) {
    const cells = [];
    for (let y = originY; y < originY + height; y += 1) {
      for (let x = originX; x < originX + width; x += 1) {
        const cell = getCell(x, y);
        if (cell) cells.push(cell);
      }
    }
    return cells;
  }

  drawPlacementOverlay(cell, color) {
    const pos = cellToScreenAtHeight(cell, visibleHeight(cell));
    const g = this.add.graphics();
    g.fillStyle(color, 0.24);
    g.fillPoints([
      { x: pos.x, y: pos.y - TILE_H / 2 },
      { x: pos.x + TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y + TILE_H / 2 },
      { x: pos.x - TILE_W / 2, y: pos.y },
    ], true);
    g.lineStyle(3, color, 0.95);
    g.strokePoints([
      { x: pos.x, y: pos.y - TILE_H / 2 },
      { x: pos.x + TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y + TILE_H / 2 },
      { x: pos.x - TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y - TILE_H / 2 },
    ], false);
  }

  drawCrop(cell, pos) {
    const crop = CROPS[cell.crop.type];
    const stage = this.cropStage(cell);
    const g = this.add.graphics();
    g.fillStyle(0x1d341b, 0.28);
    g.fillEllipse(pos.x, pos.y + 6, 34, 12);
    const texture = crop.stages[Math.max(0, stage - 1)];
    const sprite = this.add.image(pos.x, pos.y - 2, texture);
    sprite.setScale(1);
    sprite.setOrigin(0.5, 0.72);
    this.drawCropTimer(cell, pos);
  }

  drawCropTimer(cell, pos) {
    const crop = CROPS[cell.crop.type];
    const remainingMs = Math.max(0, crop.growMs - (this.time.now - cell.crop.startedAt));
    const label = remainingMs === 0 ? "Ready" : `${Math.ceil(remainingMs / 1000)}s`;
    const text = this.add.text(pos.x, pos.y - 38, label, {
      fontFamily: "Inter, Segoe UI, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 0.5);
  }

  drawPlayer() {
    const cell = getCell(editorState.player.x, editorState.player.y);
    if (!cell) return;
    const pos = cellToScreen(cell);
    const marker = this.add.graphics();
    marker.fillStyle(0x0a1114, 0.34);
    marker.fillEllipse(pos.x, pos.y + 7, 28, 10);
    marker.fillStyle(editorState.player.moving ? 0x8fd3ff : 0xffe27a, 1);
    marker.fillCircle(pos.x, pos.y - 8, 10);
    marker.lineStyle(3, 0x0a1114, 0.75);
    marker.strokeCircle(pos.x, pos.y - 8, 10);
    marker.lineStyle(2, 0xffffff, 0.85);
    marker.strokeCircle(pos.x - 2, pos.y - 11, 3);
  }

  drawEditorOverlay(cell, pos) {
    const target = editorState.blockBrush === cell.type ? 0xffffff : 0xffe27a;
    const g = this.add.graphics();
    g.lineStyle(2, target, 0.5);
    g.strokePoints([
      { x: pos.x, y: pos.y - TILE_H / 2 },
      { x: pos.x + TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y + TILE_H / 2 },
      { x: pos.x - TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y - TILE_H / 2 },
    ], false);
  }

  drawSelectionBorder(cell, pos) {
    const g = this.add.graphics();
    g.lineStyle(2, 0xffe27a, 0.95);
    g.strokePoints([
      { x: pos.x, y: pos.y - TILE_H / 2 },
      { x: pos.x + TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y + TILE_H / 2 },
      { x: pos.x - TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y - TILE_H / 2 },
    ], false);
  }

  drawSelectedPlotBorder() {
    if (!editorState.selected) return;
    const cell = terrainGrid[editorState.selected.y]?.[editorState.selected.x];
    if (!cell || cell.type !== "soil" || isBuildingTile(cell)) return;
    this.drawSelectionBorder(cell, cellToScreen(cell));
  }

  isSelectedSoil(cell) {
    return Boolean(
      editorState.selected
        && cell.type === "soil"
        && !isBuildingTile(cell)
        && editorState.selected.x === cell.x
        && editorState.selected.y === cell.y,
    );
  }

  drawHud() {
    this.statusText = null;
  }

  statusLine() {
    if (editorState.enabled) {
      return `Editor brush: ${BLOCKS[editorState.blockBrush].label}`;
    }
    return `Growing plots: ${this.cropCount()}`;
  }

  createInput() {
    this.input.keyboard.on("keydown", (event) => {
      if (isTypingInTextField()) return;
      if (event.code === "KeyR") {
        editorState.house.x = INITIAL_HOUSE.x;
        editorState.house.y = INITIAL_HOUSE.y;
        editorState.barn.x = INITIAL_BARN.x;
        editorState.barn.y = INITIAL_BARN.y;
        clearBuildingMoveState();
        terrainGrid = makeInitialGrid();
        editorState.landExpansions = 0;
        editorState.cameraPan.x = 0;
        editorState.cameraPan.y = 0;
        editorState.interiorCameraPan.x = 0;
        editorState.interiorCameraPan.y = 0;
        editorState.interiors = makeDefaultInteriors();
        editorState.selected = null;
        editorState.player.x = 1;
        editorState.player.y = 1;
        editorState.player.path = [];
        editorState.player.moving = false;
        saveActiveProfileProgress();
        this.renderScenario();
      }
      if (event.code === "KeyE") {
        setEditorMode(!editorState.enabled);
        this.renderScenario();
      }
      if (event.code === "KeyI") {
        setInventoryOpen(!editorState.inventoryOpen);
      }
      if (event.code === "KeyM") {
        setMarketOpen(!editorState.marketOpen);
      }
      if (event.code === "Escape") {
        closePanels();
      }
      if (event.code === "Equal" || event.code === "NumpadAdd") {
        this.setZoom(editorState.zoom + ZOOM_STEP);
      }
      if (event.code === "Minus" || event.code === "NumpadSubtract") {
        this.setZoom(editorState.zoom - ZOOM_STEP);
      }
      const moveByKey = {
        ArrowUp: { x: 0, y: -1 },
        KeyW: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        KeyS: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        KeyA: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyD: { x: 1, y: 0 },
      }[event.code];
      if (moveByKey) {
        const playerCell = getCell(editorState.player.x, editorState.player.y);
        const view = cellToView(playerCell);
        const target = viewToCellCoords(view.x + moveByKey.x, view.y + moveByKey.y);
        this.queuePlayerPath([
          getCell(target.x, target.y),
        ].filter(Boolean));
      }
    });

    this.input.on("wheel", (_pointer, _gameObjects, _deltaX, deltaY) => {
      this.setZoom(editorState.zoom + (deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    });

    let dragState = null;
    this.input.on("pointerdown", (pointer) => {
      dragState = {
        startX: pointer.x,
        startY: pointer.y,
        lastX: pointer.x,
        lastY: pointer.y,
        tile: pointerToTile(pointer.worldX, pointer.worldY),
        dragging: false,
        shiftKey: pointer.event.shiftKey,
      };
    });

    this.input.on("pointermove", (pointer) => {
      if (editorState.buildingPreview) {
        const tile = pointerToTile(pointer.worldX, pointer.worldY);
        if (tile) {
          if (dragState) dragState.tile = tile;
          updateBuildingPreview(editorState.buildingPreview.type, tile.x, tile.y);
          this.renderScenario();
        }
        return;
      }
      if (!dragState || !pointer.isDown) return;
      const totalDx = pointer.x - dragState.startX;
      const totalDy = pointer.y - dragState.startY;
      if (!dragState.dragging && Math.hypot(totalDx, totalDy) < 8) return;
      dragState.dragging = true;
      const dx = pointer.x - dragState.lastX;
      const dy = pointer.y - dragState.lastY;
      dragState.lastX = pointer.x;
      dragState.lastY = pointer.y;
      editorState.cameraPan.x -= dx / editorState.zoom;
      editorState.cameraPan.y -= dy / editorState.zoom;
      this.applyZoom();
    });

    this.input.on("pointerup", (pointer) => {
      if (!dragState) return;
      if (dragState.dragging) {
        saveActiveProfileProgress();
        dragState = null;
        return;
      }
      const tile = dragState.tile;
      const shiftKey = dragState.shiftKey;
      dragState = null;
      this.handleTileClick(tile, shiftKey);
    });
  }

  handleTileClick(tile, shiftKey = false) {
      if (!tile) return;
      if (editorState.enabled && editorState.houseMoving) {
        const preview = updateBuildingPreview("house", tile.x, tile.y);
        if (preview?.valid) moveHouseFromNorthAnchor(tile.x, tile.y);
        this.flashTile(tile);
        this.renderScenario();
        return;
      }
      if (editorState.enabled && editorState.barnMoving) {
        const preview = updateBuildingPreview("barn", tile.x, tile.y);
        if (preview?.valid) moveBarnFromNorthAnchor(tile.x, tile.y);
        this.flashTile(tile);
        this.renderScenario();
        return;
      }
      if (editorState.enabled && isHouseTile(tile)) {
        editorState.houseMoving = true;
        editorState.barnMoving = false;
        const anchor = northAnchorOffset(editorState.house);
        updateBuildingPreview("house", editorState.house.x + anchor.x, editorState.house.y + anchor.y);
        editorState.selected = null;
        this.renderScenario();
        return;
      }
      if (editorState.enabled && isBarnTile(tile)) {
        editorState.houseMoving = false;
        editorState.barnMoving = true;
        const anchor = northAnchorOffset(editorState.barn);
        updateBuildingPreview("barn", editorState.barn.x + anchor.x, editorState.barn.y + anchor.y);
        editorState.selected = null;
        this.renderScenario();
        return;
      }
      if (!editorState.enabled && isHouseTile(tile)) {
        this.scene.start("HouseInteriorScene");
        return;
      }
      if (!editorState.enabled && shiftKey && isWalkable(tile) && !isPlayerAt(tile)) {
        const path = buildTilePath(editorState.player.x, editorState.player.y, tile.x, tile.y);
        if (path.length) this.queuePlayerPath(path);
        return;
      }
      if (editorState.enabled) {
        editorState.selected = tile.type === "soil" && !isBuildingTile(tile) ? { x: tile.x, y: tile.y } : null;
        this.paintBlock(tile, shiftKey);
      } else {
        this.applyCrop(tile);
      }
      this.flashTile(tile);
      this.renderScenario();
  }

  rotateView() {
    if (!profileCan("rotateCamera")) return;
    editorState.viewRotation = (editorState.viewRotation + 1) % 4;
    renderViewUi();
    saveActiveProfileProgress();
    this.renderScenario();
  }

  setZoom(zoom) {
    editorState.zoom = Phaser.Math.Clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    this.applyZoom();
    saveActiveProfileProgress();
  }

  applyZoom() {
    this.cameras.main.setZoom(editorState.zoom);
    this.cameras.main.centerOn(
      this.scale.width / 2 + editorState.cameraPan.x,
      this.scale.height / 2 + editorState.cameraPan.y,
    );
  }

  queuePlayerPath(path) {
    const walkablePath = path.filter(isWalkable);
    if (!walkablePath.length) return;
    editorState.player.path = walkablePath.map((cell) => ({ x: cell.x, y: cell.y }));
    this.stepPlayer();
  }

  stepPlayer() {
    if (editorState.player.moving || !editorState.player.path.length) return;
    const next = editorState.player.path.shift();
    const cell = getCell(next.x, next.y);
    if (!isWalkable(cell)) return;
    editorState.player.moving = true;
    this.renderScenario();
    this.time.delayedCall(PLAYER_STEP_MS, () => {
      editorState.player.x = next.x;
      editorState.player.y = next.y;
      editorState.player.moving = false;
      saveActiveProfileProgress();
      this.renderScenario();
      this.stepPlayer();
    });
  }

  paintBlock(tile, lower = false) {
    if (isBuildingTile(tile)) return;
    if (lower) {
      if (!profileCan("shapeElevatedTerrain")) return;
      tile.height = Math.max(tile.type === "water" ? 0 : 1, tile.height - 1);
      saveActiveProfileProgress();
      this.statusText?.setText(`Lowered (${tile.x}, ${tile.y})`);
      return;
    }
    if (tile.type === editorState.blockBrush && tile.type !== "water") {
      if (!profileCan("shapeElevatedTerrain")) return;
      tile.height = Math.min(6, tile.height + 1);
      saveActiveProfileProgress();
      this.statusText?.setText(`Stacked (${tile.x}, ${tile.y}) to height ${tile.height}`);
      return;
    }
    tile.type = editorState.blockBrush;
    if (tile.type === "water") {
      tile.height = 0;
      tile.crop = null;
    } else if (tile.height === 0) {
      tile.height = 1;
    }
    if (tile.type !== "soil") tile.crop = null;
    editorState.selected = tile.type === "soil" && !isBuildingTile(tile) ? { x: tile.x, y: tile.y } : null;
    saveActiveProfileProgress();
    this.statusText?.setText(`Painted (${tile.x}, ${tile.y}) as ${BLOCKS[tile.type].label}`);
  }

  applyCrop(tile) {
    if (tile.type !== "soil" || isBuildingTile(tile)) {
      editorState.selected = null;
      return;
    }
    const itemId = slotItemId(editorState.toolbarItems[editorState.selectedToolbarIndex]);
    const item = itemId ? ITEMS[itemId] : null;
    if (!item) {
      editorState.selected = null;
      return;
    }
    if (item.action === "harvest") {
      editorState.selected = { x: tile.x, y: tile.y };
      this.harvestCrop(tile);
      return;
    }
    if (item.type !== "seed" || !item.crop || tile.crop) {
      editorState.selected = null;
      return;
    }
    editorState.selected = { x: tile.x, y: tile.y };
    tile.crop = {
      type: item.crop,
      startedAt: this.time.now,
    };
    consumeToolbarItem(editorState.selectedToolbarIndex);
  }

  harvestCrop(tile) {
    if (!tile.crop || !this.isCropReady(tile)) return;
    const produceId = `${tile.crop.type}Produce`;
    if (!addInventoryItem(produceId)) return;
    tile.crop = null;
    renderItemUi();
    saveActiveProfileProgress();
  }

  flashTile(cell) {
    const pos = cellToScreen(cell);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.22);
    g.fillPoints([
      { x: pos.x, y: pos.y - TILE_H / 2 },
      { x: pos.x + TILE_W / 2, y: pos.y },
      { x: pos.x, y: pos.y + TILE_H / 2 },
      { x: pos.x - TILE_W / 2, y: pos.y },
    ], true);
    this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });
  }

  hasGrowingCrops() {
    return terrainGrid.some((row) => row.some((cell) => cell.crop));
  }

  cropCount() {
    return terrainGrid.reduce((total, row) => total + row.filter((cell) => cell.crop).length, 0);
  }

  cropStage(cell) {
    if (!cell.crop) return 0;
    const crop = CROPS[cell.crop.type];
    const elapsed = this.time.now - cell.crop.startedAt;
    const progress = Phaser.Math.Clamp(elapsed / crop.growMs, 0, 1);
    return progress >= 1 ? 3 : progress >= 0.66 ? 2 : progress >= 0.33 ? 1 : 0;
  }

  isCropReady(cell) {
    return this.cropStage(cell) >= 3;
  }

  cellSeed(cell) {
    return (cell.x * 92821 + cell.y * 68917 + cell.height * 31337) % 9973;
  }

  pickTextureColor(type, seed, offset) {
    const palette = this.texturePalettes?.[type];
    if (!palette?.length) return BLOCKS[type].topLight;
    return palette[(seed + offset) % palette.length];
  }
}

