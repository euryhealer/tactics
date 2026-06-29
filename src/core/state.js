const TILE_W = 86;
const TILE_H = 44;
const BLOCK_H = 28;
const ORIGIN_X = 580;
const ORIGIN_Y = 118;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.45;
const ZOOM_STEP = 0.12;
const LAND_BASE_PRICE = 20;
const LAND_PRICE_STEP = 15;
const PLAYER_STEP_MS = 180;
const SAVE_VERSION = 1;
const INITIAL_HOUSE = {
  x: 8,
  y: 1,
};
const INITIAL_BARN = {
  x: 3,
  y: 5,
};
const HOUSE_FOOTPRINT = {
  width: 2,
  height: 2,
  baseHeight: 2,
  spriteOffsetX: 2,
  spriteYOffset: 29,
  spriteScale: 1.15,
};
const BARN_FOOTPRINT = {
  width: 3,
  height: 3,
  baseHeight: 2,
  spriteOffsetX: -2,
  spriteYOffset: 44,
  spriteScale: 1,
};

const USER_PROFILES = {
  GM: {
    id: "GM",
    name: "GM",
    title: "Game Manager",
    isMain: true,
    permissions: {
      shapeElevatedTerrain: true,
      rotateCamera: true,
    },
  },
};

const BLOCKS = {
  grass: {
    label: "Grass",
    texture: "grassTop",
    top: 0x5f9634,
    topLight: 0x8ccf48,
    left: 0x42692c,
    right: 0x2c4b28,
    side: 0x6d5236,
  },
  water: {
    label: "Water",
    texture: "waterTop",
    top: 0x2479bd,
    topLight: 0x4cb7e6,
    left: 0x15588e,
    right: 0x103f70,
    side: 0x164d82,
  },
  soil: {
    label: "Soil",
    texture: "soilTop",
    top: 0x7d4f2b,
    topLight: 0xb57942,
    left: 0x5b3b25,
    right: 0x3f2a1f,
    side: 0x6f4a30,
  },
};

const CROPS = {
  carrot: {
    label: "Carrot",
    growMs: 9000,
    seedTexture: "carrotSeed",
    stages: ["carrotStage1", "carrotStage2", "carrotStage3"],
  },
  wheat: {
    label: "Wheat",
    growMs: 18000,
    seedTexture: "wheatSeed",
    stages: ["wheatStage1", "wheatStage2", "wheatStage3"],
  },
  turnip: {
    label: "Turnip",
    growMs: 30000,
    seedTexture: "turnipSeed",
    stages: ["turnipStage1", "turnipStage2", "turnipStage3"],
  },
};

const ITEMS = {
  harvestHand: {
    id: "harvestHand",
    label: "Harvest",
    action: "harvest",
    icon: "assets/items/harvest-hand.png",
    toolbarOnly: true,
  },
  carrot: {
    id: "carrot",
    label: "Carrot Seeds",
    type: "seed",
    crop: "carrot",
    icon: "assets/items/carrot-seed-pack.png",
    buyPrice: 4,
  },
  wheat: {
    id: "wheat",
    label: "Wheat Seeds",
    type: "seed",
    crop: "wheat",
    icon: "assets/items/wheat-seed-pack.png",
    buyPrice: 7,
  },
  turnip: {
    id: "turnip",
    label: "Turnip Seeds",
    type: "seed",
    crop: "turnip",
    icon: "assets/items/turnip-seed-pack.png",
    buyPrice: 10,
  },
  carrotProduce: {
    id: "carrotProduce",
    label: "Carrot",
    type: "produce",
    icon: "assets/items/carrot-produce.png",
    toolbarAllowed: false,
    sellPrice: 9,
  },
  wheatProduce: {
    id: "wheatProduce",
    label: "Wheat",
    type: "produce",
    icon: "assets/items/wheat-produce.png",
    toolbarAllowed: false,
    sellPrice: 16,
  },
  turnipProduce: {
    id: "turnipProduce",
    label: "Turnip",
    type: "produce",
    icon: "assets/items/turnip-produce.png",
    toolbarAllowed: false,
    sellPrice: 25,
  },
};

const MAX_STACK = 99;

function makeStack(id, qty = 1) {
  return { id, qty };
}

function slotItemId(slot) {
  return typeof slot === "string" ? slot : slot?.id ?? null;
}

function slotQty(slot) {
  return typeof slot === "string" ? 1 : slot?.qty ?? 0;
}

const INITIAL_MAP = [
  ["grass:1", "grass:1", "grass:1", "grass:1", "soil:1", "soil:1", "water:0", "water:0", "grass:1", "grass:1", "grass:1"],
  ["grass:1", "soil:1", "soil:1", "grass:1", "soil:1", "soil:1", "water:0", "grass:1", "soil:1", "soil:1", "grass:1"],
  ["grass:1", "soil:1", "soil:1", "grass:1", "water:0", "water:0", "water:0", "grass:1", "soil:1", "soil:1", "grass:1"],
  ["grass:1", "grass:1", "soil:1", "soil:1", "water:0", "water:0", "water:0", "grass:1", "soil:1", "soil:1", "grass:1"],
  ["grass:1", "grass:1", "water:0", "water:0", "water:0", "soil:1", "soil:1", "soil:1", "soil:1", "grass:1", "grass:1"],
  ["grass:1", "grass:1", "water:0", "grass:1", "grass:1", "soil:1", "water:0", "grass:1", "soil:1", "soil:1", "grass:1"],
  ["grass:1", "grass:1", "water:0", "grass:1", "soil:1", "soil:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1"],
  ["grass:1", "grass:1", "grass:1", "grass:1", "soil:1", "soil:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1"],
  ["grass:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1", "grass:1"],
];

const ui = {
  modeToggle: document.querySelector("#modeToggle"),
  modeHint: document.querySelector("#modeHint"),
  blockTools: [...document.querySelectorAll('[data-tool="block"]')],
  itemToolbar: document.querySelector("#itemToolbar"),
  inventoryPanel: document.querySelector("#inventoryPanel"),
  inventoryGrid: document.querySelector("#inventoryGrid"),
  inventoryClose: document.querySelector("#inventoryClose"),
  cameraRotate: document.querySelector("#cameraRotate"),
  cameraAngle: document.querySelector("#cameraAngle"),
  goldAmount: document.querySelector("#goldAmount"),
  marketToggle: document.querySelector("#marketToggle"),
  marketPanel: document.querySelector("#marketPanel"),
  marketGrid: document.querySelector("#marketGrid"),
  marketClose: document.querySelector("#marketClose"),
  profileName: document.querySelector("#profileName"),
  zoomIn: document.querySelector("#zoomIn"),
  zoomOut: document.querySelector("#zoomOut"),
};

const DEFAULT_INTERIORS = {
  house: {
    items: {
      bed: { id: "bed", texture: "interiorBed", x: 1, y: 1, width: 2, height: 3, scale: 0.72, offsetY: -10, originY: 0.72 },
      stove: { id: "stove", texture: "interiorStove", x: 5, y: 1, width: 2, height: 2, scale: 0.62, offsetY: -2, originY: 0.78 },
      wardrobe: { id: "wardrobe", texture: "interiorWardrobe", x: 0, y: 1, width: 2, height: 1, scale: 0.68, offsetY: -3, originY: 0.82 },
    },
  },
};

function cloneInteriorItems(interiorId) {
  const interior = DEFAULT_INTERIORS[interiorId];
  if (!interior) return {};
  return Object.fromEntries(
    Object.entries(interior.items).map(([itemId, item]) => [itemId, { ...item }]),
  );
}

function makeDefaultInteriors() {
  return Object.fromEntries(
    Object.keys(DEFAULT_INTERIORS).map((interiorId) => [
      interiorId,
      { items: cloneInteriorItems(interiorId) },
    ]),
  );
}

const editorState = {
  activeProfileId: "GM",
  profiles: USER_PROFILES,
  enabled: false,
  blockBrush: "grass",
  selected: null,
  selectedToolbarIndex: 1,
  inventoryOpen: false,
  marketOpen: false,
  interiors: makeDefaultInteriors(),
  gold: 24,
  landExpansions: 0,
  viewRotation: 0,
  zoom: 1,
  cameraPan: {
    x: 0,
    y: 0,
  },
  interiorCameraPan: {
    x: 0,
    y: 0,
  },
  houseMoving: false,
  barnMoving: false,
  buildingPreview: null,
  house: {
    x: INITIAL_HOUSE.x,
    y: INITIAL_HOUSE.y,
    width: HOUSE_FOOTPRINT.width,
    height: HOUSE_FOOTPRINT.height,
  },
  barn: {
    x: INITIAL_BARN.x,
    y: INITIAL_BARN.y,
    width: BARN_FOOTPRINT.width,
    height: BARN_FOOTPRINT.height,
  },
  player: {
    x: 1,
    y: 1,
    moving: false,
    path: [],
  },
  toolbarItems: [makeStack("harvestHand"), makeStack("carrot"), null, null, null],
  inventoryItems: [makeStack("wheat"), makeStack("turnip"), null, null, null, null, null, null, null, null],
};

