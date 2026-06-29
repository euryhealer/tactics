class HouseInteriorScene extends Phaser.Scene {
  constructor() {
    super("HouseInteriorScene");
    this.interiorId = "house";
    this.exitZone = null;
    this.movingItem = null;
    this.itemPreview = null;
    this.interiorItems = null;
  }

  preload() {
    this.load.image("interiorBed", "assets/interior/bed.png");
    this.load.image("interiorStove", "assets/interior/stove.png");
    this.load.image("interiorWardrobe", "assets/interior/wardrobe.png");
  }

  create() {
    document.body.classList.add("interior-active");
    closePanels();
    if (!editorState.interiors[this.interiorId]) {
      editorState.interiors[this.interiorId] = { items: cloneInteriorItems(this.interiorId) };
    }
    this.interiorItems = editorState.interiors[this.interiorId].items;
    this.cameras.main.setBackgroundColor("#000000");
    this.applyInteriorPan();
    this.drawInterior();
    this.input.keyboard.on("keydown-ESC", () => this.returnToFarm());
    let dragState = null;
    this.input.on("pointerdown", (pointer) => {
      dragState = {
        startX: pointer.x,
        startY: pointer.y,
        lastX: pointer.x,
        lastY: pointer.y,
        worldX: pointer.worldX,
        worldY: pointer.worldY,
        dragging: false,
      };
    });
    this.input.on("pointermove", (pointer) => {
      if (!this.movingItem) return;
      const tile = this.pointerToInteriorTile(pointer.worldX, pointer.worldY);
      if (!tile) return;
      this.updateInteriorPreview(tile.x, tile.y);
      this.drawInterior();
    });
    this.input.on("pointermove", (pointer) => {
      if (!dragState || !pointer.isDown || this.movingItem) return;
      const totalDx = pointer.x - dragState.startX;
      const totalDy = pointer.y - dragState.startY;
      if (!dragState.dragging && Math.hypot(totalDx, totalDy) < 8) return;
      dragState.dragging = true;
      const dx = pointer.x - dragState.lastX;
      const dy = pointer.y - dragState.lastY;
      dragState.lastX = pointer.x;
      dragState.lastY = pointer.y;
      editorState.interiorCameraPan.x -= dx;
      editorState.interiorCameraPan.y -= dy;
      this.applyInteriorPan();
    });
    this.input.on("pointerup", (pointer) => {
      if (!dragState) return;
      if (dragState.dragging) {
        saveActiveProfileProgress();
        dragState = null;
        return;
      }
      dragState = null;
      this.handleInteriorClick(pointer.worldX, pointer.worldY);
    });
    this.events.once("shutdown", () => {
      document.body.classList.remove("interior-active");
    });
  }

  applyInteriorPan() {
    this.cameras.main.centerOn(
      this.scale.width / 2 + editorState.interiorCameraPan.x,
      this.scale.height / 2 + editorState.interiorCameraPan.y,
    );
  }

  handleInteriorClick(worldX, worldY) {
    const tile = this.pointerToInteriorTile(worldX, worldY);
    if (this.itemPreview) {
      if (this.itemPreview.valid) this.placeInteriorItem();
      else this.drawInterior();
      return;
    }
    const item = tile ? this.itemAtTile(tile.x, tile.y) : null;
    if (item) {
      this.startMovingInteriorItem(item.id);
      return;
    }
    if (this.exitZone && Phaser.Geom.Rectangle.Contains(this.exitZone, worldX, worldY)) {
      this.returnToFarm();
    }
  }

  returnToFarm() {
    this.scene.start("TacticsScene");
  }

  drawInterior() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    this.interiorOrigin = { x: 580, y: 166 };
    this.interiorTileW = 78;
    this.interiorTileH = 40;
    this.interiorBlockH = 18;
    this.interiorStyles = {
      bedroom: { top: 0x7a5635, topLight: 0x9a7048, left: 0x4f3825, right: 0x39291d },
      kitchen: { top: 0x556b5a, topLight: 0x78927b, left: 0x354538, right: 0x29362d },
      living: { top: 0x60442d, topLight: 0x806042, left: 0x3e2c20, right: 0x2d2118 },
      divider: { top: 0x9a7144, topLight: 0xc09058, left: 0x60432a, right: 0x46301f },
      exit: { top: 0x17100b, topLight: 0xd2b071, left: 0x0b0705, right: 0x080604 },
    };

    const tiles = this.createInteriorTiles();
    tiles.sort((a, b) => (a.x + a.y) * 100 + a.height * 8 - ((b.x + b.y) * 100 + b.height * 8));
    for (const tile of tiles) this.drawInteriorBlock(tile);

    this.drawInteriorItems();
    this.drawInteriorItemPreview();

    const exitPos = this.interiorCellToScreen(3, 6, 1);
    this.exitZone = new Phaser.Geom.Rectangle(exitPos.x - 42, exitPos.y - 26, 84, 52);
  }

  createInteriorTiles() {
    const tiles = [];
    const width = 8;
    const height = 7;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let type = y < 3 ? (x < 4 ? "bedroom" : "kitchen") : "living";
        let blockHeight = 1;
        let blocking = false;
        if (x === 4 && y < 3) type = "divider";
        if (y === 3 && !(x >= 3 && x <= 4)) type = "divider";
        if ((x === 0 || x === width - 1 || y === 0 || y === height - 1) && !(x === 3 && y === height - 1)) {
          type = "divider";
        }
        if (x === 3 && y === height - 1) {
          type = "exit";
          blockHeight = 1;
          blocking = true;
        }
        tiles.push({ x, y, type, height: blockHeight, blocking });
      }
    }
    return tiles;
  }

  interiorCellToScreen(x, y, height = 0) {
    return {
      x: this.interiorOrigin.x + (x - y) * (this.interiorTileW / 2),
      y: this.interiorOrigin.y + (x + y) * (this.interiorTileH / 2) - height * this.interiorBlockH,
    };
  }

  pointerToInteriorTile(screenX, screenY) {
    let best = null;
    let bestScore = Infinity;
    for (const tile of this.createInteriorTiles()) {
      const pos = this.interiorCellToScreen(tile.x, tile.y, tile.height);
      const dx = Math.abs(screenX - pos.x) / (this.interiorTileW / 2);
      const dy = Math.abs(screenY - pos.y) / (this.interiorTileH / 2);
      const score = dx + dy;
      if (score < 1.05 && score < bestScore) {
        best = tile;
        bestScore = score;
      }
    }
    return best;
  }

  interiorNorthAnchorOffset(item) {
    return {
      x: Math.floor((item.width - 1) / 2),
      y: 0,
    };
  }

  interiorOriginFromAnchor(anchorX, anchorY, item) {
    const anchor = this.interiorNorthAnchorOffset(item);
    return {
      x: anchorX - anchor.x,
      y: anchorY - anchor.y,
    };
  }

  interiorFootprintCells(item, originX = item.x, originY = item.y) {
    const cells = [];
    for (let y = originY; y < originY + item.height; y += 1) {
      for (let x = originX; x < originX + item.width; x += 1) {
        cells.push({ x, y });
      }
    }
    return cells;
  }

  itemAtTile(x, y) {
    return Object.values(this.interiorItems).find((item) => (
      x >= item.x && x < item.x + item.width && y >= item.y && y < item.y + item.height
    )) ?? null;
  }

  canPlaceInteriorItem(item, originX, originY) {
    const tiles = new Map(this.createInteriorTiles().map((tile) => [`${tile.x},${tile.y}`, tile]));
    for (const cell of this.interiorFootprintCells(item, originX, originY)) {
      const tile = tiles.get(`${cell.x},${cell.y}`);
      if (!tile || tile.blocking) return false;
      const blockingItem = this.itemAtTile(cell.x, cell.y);
      if (blockingItem && blockingItem.id !== item.id) return false;
    }
    return true;
  }

  startMovingInteriorItem(itemId) {
    const item = this.interiorItems[itemId];
    if (!item) return;
    this.movingItem = itemId;
    const anchor = this.interiorNorthAnchorOffset(item);
    this.updateInteriorPreview(item.x + anchor.x, item.y + anchor.y);
    this.drawInterior();
  }

  updateInteriorPreview(anchorX, anchorY) {
    const item = this.interiorItems[this.movingItem];
    if (!item) return;
    const origin = this.interiorOriginFromAnchor(anchorX, anchorY, item);
    this.itemPreview = {
      id: item.id,
      anchorX,
      anchorY,
      originX: origin.x,
      originY: origin.y,
      valid: this.canPlaceInteriorItem(item, origin.x, origin.y),
    };
  }

  placeInteriorItem() {
    const preview = this.itemPreview;
    if (!preview?.valid) return;
    const item = this.interiorItems[preview.id];
    item.x = preview.originX;
    item.y = preview.originY;
    this.movingItem = null;
    this.itemPreview = null;
    saveActiveProfileProgress();
    this.drawInterior();
  }

  drawInteriorItems() {
    for (const item of Object.values(this.interiorItems)) {
      if (this.movingItem === item.id) continue;
      this.drawInteriorItemSprite(item);
    }
  }

  drawInteriorItemPreview() {
    const preview = this.itemPreview;
    if (!preview) return;
    const item = this.interiorItems[preview.id];
    const color = preview.valid ? 0x59e77a : 0xff4f4f;
    for (const cell of this.interiorFootprintCells(item, preview.originX, preview.originY)) {
      this.drawInteriorPlacementOverlay(cell.x, cell.y, color);
    }
    this.drawInteriorItemSprite(item, preview.originX, preview.originY, preview.valid ? 0.72 : 0.45);
  }

  drawInteriorItemSprite(item, originX = item.x, originY = item.y, alpha = 1) {
    const centerX = originX + (item.width - 1) / 2;
    const centerY = originY + (item.height - 1) / 2;
    const pos = this.interiorCellToScreen(centerX, centerY, 1);
    const sprite = this.add.image(pos.x, pos.y + item.offsetY, item.texture);
    sprite.setOrigin(0.5, item.originY);
    sprite.setScale(item.scale);
    sprite.setAlpha(alpha);
  }

  drawInteriorPlacementOverlay(x, y, color) {
    const pos = this.interiorCellToScreen(x, y, 1);
    const halfW = this.interiorTileW / 2;
    const halfH = this.interiorTileH / 2;
    const g = this.add.graphics();
    g.fillStyle(color, 0.24);
    g.fillPoints([
      { x: pos.x, y: pos.y - halfH },
      { x: pos.x + halfW, y: pos.y },
      { x: pos.x, y: pos.y + halfH },
      { x: pos.x - halfW, y: pos.y },
    ], true);
    g.lineStyle(3, color, 0.95);
    g.strokePoints([
      { x: pos.x, y: pos.y - halfH },
      { x: pos.x + halfW, y: pos.y },
      { x: pos.x, y: pos.y + halfH },
      { x: pos.x - halfW, y: pos.y },
      { x: pos.x, y: pos.y - halfH },
    ], false);
  }

  drawInteriorBlock(tile) {
    const style = this.interiorStyles[tile.type];
    const pos = this.interiorCellToScreen(tile.x, tile.y, tile.height);
    const halfW = this.interiorTileW / 2;
    const halfH = this.interiorTileH / 2;
    const left = pos.x - halfW;
    const right = pos.x + halfW;
    const top = pos.y - halfH;
    const mid = pos.y;
    const bottom = pos.y + halfH;
    const base = bottom + tile.height * this.interiorBlockH;
    const g = this.add.graphics();

    g.fillStyle(style.left, 1);
    g.fillPoints([{ x: left, y: mid }, { x: pos.x, y: bottom }, { x: pos.x, y: base }, { x: left, y: base - halfH }], true);
    g.fillStyle(style.right, 1);
    g.fillPoints([{ x: right, y: mid }, { x: pos.x, y: bottom }, { x: pos.x, y: base }, { x: right, y: base - halfH }], true);
    g.fillStyle(style.top, 1);
    g.fillPoints([{ x: pos.x, y: top }, { x: right, y: mid }, { x: pos.x, y: bottom }, { x: left, y: mid }], true);
    g.fillStyle(style.topLight, 0.16);
    g.fillPoints([{ x: pos.x, y: top + 5 }, { x: right - 12, y: mid }, { x: pos.x, y: bottom - 6 }, { x: left + 12, y: mid }], true);
    g.lineStyle(2, 0xd8e0dc, 0.24);
    g.strokePoints([{ x: pos.x, y: top }, { x: right, y: mid }, { x: pos.x, y: bottom }, { x: left, y: mid }, { x: pos.x, y: top }], false);
  }

}

