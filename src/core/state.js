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
const PROFILE_REGISTRY_KEY = `tactics.profiles.v${SAVE_VERSION}`;
const ACTIVE_PROFILE_KEY = `tactics.activeProfile.v${SAVE_VERSION}`;
const GM_ACCESS_PATH = "/GMANAGER";
const IS_GM_ACCESS = window.location.pathname.replace(/\/$/, "") === GM_ACCESS_PATH
  || new URLSearchParams(window.location.search).get("gm") === "1";
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
  apple: {
    id: "apple",
    label: "Apple",
    type: "fruit",
    icon: "assets/items/apple.png",
    toolbarAllowed: false,
    sellPrice: 12,
  },
  orange: {
    id: "orange",
    label: "Orange",
    type: "fruit",
    icon: "assets/items/orange.png",
    toolbarAllowed: false,
    sellPrice: 14,
  },
  berry: {
    id: "berry",
    label: "Berry",
    type: "fruit",
    icon: "assets/items/berry.png",
    toolbarAllowed: false,
    sellPrice: 10,
  },
  appleSapling: {
    id: "appleSapling",
    label: "Apple Seeds",
    type: "treeSeed",
    tree: "appleTree",
    icon: "assets/items/apple-seed-pack.png",
    buyPrice: 2,
  },
  orangeSapling: {
    id: "orangeSapling",
    label: "Orange Seeds",
    type: "treeSeed",
    tree: "orangeTree",
    icon: "assets/items/orange-seed-pack.png",
    buyPrice: 3,
  },
  berrySeed: {
    id: "berrySeed",
    label: "Berry Seeds",
    type: "treeSeed",
    tree: "berryBush",
    icon: "assets/items/berry-seed-pack.png",
    buyPrice: 1,
  },
  chicken: {
    id: "chicken",
    label: "Chicken",
    type: "animal",
    animal: "chicken",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='none'/%3E%3Cpath d='M20 40c-3-13 7-25 21-22 11 2 16 15 10 25-6 10-25 11-31-3z' fill='%23fff0c7' stroke='%23624b2e' stroke-width='3'/%3E%3Cpath d='M39 18c0-7 8-8 10-2 5-1 8 4 5 8' fill='%23e54435' stroke='%2364211b' stroke-width='2'/%3E%3Ccircle cx='43' cy='29' r='3' fill='%23101618'/%3E%3Cpath d='M51 33l8 4-8 4z' fill='%23f5a12c' stroke='%236d3913' stroke-width='2'/%3E%3Cpath d='M29 47l-3 9M39 48l3 8' stroke='%23c98025' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
    buyPrice: 120,
  },
  cow: {
    id: "cow",
    label: "Cow",
    type: "animal",
    animal: "cow",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='none'/%3E%3Cpath d='M13 33c0-11 9-19 23-19 13 0 22 8 22 19 0 12-9 20-22 20-14 0-23-8-23-20z' fill='%23f4ead7' stroke='%23443124' stroke-width='3'/%3E%3Cpath d='M21 20c5-5 14-5 17 3-3 5-13 6-17-3zM41 35c7-2 12 2 11 9-6 4-13 0-11-9z' fill='%233f3128'/%3E%3Cpath d='M15 27l-8-6M50 25l8-6' stroke='%23815a35' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='25' cy='33' r='3' fill='%23101316'/%3E%3Ccircle cx='43' cy='33' r='3' fill='%23101316'/%3E%3Cpath d='M29 42c3 3 9 3 12 0' stroke='%23815a35' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
    buyPrice: 260,
  },
  egg: {
    id: "egg",
    label: "Egg",
    type: "animalProduct",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='none'/%3E%3Cpath d='M32 8c12 0 21 20 18 34-2 10-9 16-18 16s-16-6-18-16C11 28 20 8 32 8z' fill='%23fff0cf' stroke='%23624b2e' stroke-width='3'/%3E%3Cpath d='M24 22c3-5 9-8 15-6' stroke='%23ffffff' stroke-width='5' stroke-linecap='round' opacity='.65'/%3E%3C/svg%3E",
    toolbarAllowed: false,
    sellPrice: 18,
  },
  milk: {
    id: "milk",
    label: "Milk",
    type: "animalProduct",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='none'/%3E%3Cpath d='M24 7h16l2 13 8 9v26H14V29l8-9z' fill='%23f7fbff' stroke='%23324450' stroke-width='3'/%3E%3Cpath d='M22 20h20M20 36h24' stroke='%2387c5e8' stroke-width='4'/%3E%3Cpath d='M24 7h16v9H24z' fill='%23dfeef7' stroke='%23324450' stroke-width='3'/%3E%3C/svg%3E",
    toolbarAllowed: false,
    sellPrice: 32,
  },
};

const TREE_TYPES = {
  appleTree: {
    id: "appleTree",
    label: "Apple Tree",
    saplingItem: "appleSapling",
    fruitItem: "apple",
    growMs: 45000,
    harvestCooldownMs: 45000,
    stages: ["appleTreeStage1", "appleTreeStage2", "appleTreeStage3"],
    footprint: { width: 1, height: 1 },
  },
  orangeTree: {
    id: "orangeTree",
    label: "Orange Tree",
    saplingItem: "orangeSapling",
    fruitItem: "orange",
    growMs: 60000,
    harvestCooldownMs: 60000,
    stages: ["orangeTreeStage1", "orangeTreeStage2", "orangeTreeStage3"],
    footprint: { width: 1, height: 1 },
  },
  berryBush: {
    id: "berryBush",
    label: "Berry Bush",
    saplingItem: "berrySeed",
    fruitItem: "berry",
    growMs: 30000,
    harvestCooldownMs: 30000,
    stages: ["berryBushStage1", "berryBushStage2", "berryBushStage3"],
    footprint: { width: 1, height: 1 },
  },
};

const ANIMAL_TYPES = {
  chicken: {
    id: "chicken",
    label: "Chicken",
    productItem: "egg",
    productionMs: 60000,
    homeType: "barn",
  },
  cow: {
    id: "cow",
    label: "Cow",
    productItem: "milk",
    productionMs: 120000,
    homeType: "barn",
  },
};

const MARKETPLACE_LISTINGS = [
  { id: "mock-apple", seller: "Orchard Guild", itemId: "apple", qty: 8, priceCurrency: "premiumToken", unitPrice: 1 },
  { id: "mock-orange", seller: "Sun Grove", itemId: "orange", qty: 6, priceCurrency: "premiumToken", unitPrice: 1 },
  { id: "mock-berry", seller: "Berry Coop", itemId: "berry", qty: 12, priceCurrency: "premiumToken", unitPrice: 1 },
  { id: "mock-apple-sapling", seller: "Tree Nursery", itemId: "appleSapling", qty: 1, priceCurrency: "premiumToken", unitPrice: 2 },
  { id: "mock-orange-sapling", seller: "Tree Nursery", itemId: "orangeSapling", qty: 1, priceCurrency: "premiumToken", unitPrice: 3 },
  { id: "mock-berry-seed", seller: "Berry Coop", itemId: "berrySeed", qty: 1, priceCurrency: "premiumToken", unitPrice: 1 },
  { id: "mock-chicken", seller: "Valley Ranch", itemId: "chicken", qty: 1, priceCurrency: "premiumToken", unitPrice: 4 },
  { id: "mock-cow", seller: "Valley Ranch", itemId: "cow", qty: 1, priceCurrency: "premiumToken", unitPrice: 8 },
];

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

function isTypingInTextField() {
  const element = document.activeElement;
  if (!element) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) || element.isContentEditable;
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
  inventoryToggle: document.querySelector("#inventoryToggle"),
  inventoryPanel: document.querySelector("#inventoryPanel"),
  inventoryGrid: document.querySelector("#inventoryGrid"),
  inventoryClose: document.querySelector("#inventoryClose"),
  cameraRotate: document.querySelector("#cameraRotate"),
  cameraAngle: document.querySelector("#cameraAngle"),
  goldAmount: document.querySelector("#goldAmount"),
  premiumTokenAmount: document.querySelector("#premiumTokenAmount"),
  marketToggle: document.querySelector("#marketToggle"),
  marketplaceToggle: document.querySelector("#marketplaceToggle"),
  marketPanel: document.querySelector("#marketPanel"),
  marketGrid: document.querySelector("#marketGrid"),
  marketClose: document.querySelector("#marketClose"),
  marketplacePanel: document.querySelector("#marketplacePanel"),
  marketplaceGrid: document.querySelector("#marketplaceGrid"),
  marketplaceClose: document.querySelector("#marketplaceClose"),
  profileName: document.querySelector("#profileName"),
  logoutButton: document.querySelector("#logoutButton"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginSubtitle: document.querySelector("#loginSubtitle"),
  loginProfileSelect: document.querySelector("#loginProfileSelect"),
  loginProfileInput: document.querySelector("#loginProfileInput"),
  loginButton: document.querySelector("#loginButton"),
  createProfileButton: document.querySelector("#createProfileButton"),
  loginMessage: document.querySelector("#loginMessage"),
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

function makePlayerProfile(id, name) {
  return {
    id,
    name,
    title: "Player",
    isMain: false,
    permissions: {
      shapeElevatedTerrain: false,
      rotateCamera: false,
    },
  };
}

function loadProfileRegistry() {
  if (!window.localStorage) return { ...USER_PROFILES };
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_REGISTRY_KEY) || "null");
    const profiles = { ...USER_PROFILES };
    if (saved && typeof saved === "object") {
      for (const profile of Object.values(saved)) {
        if (!profile?.id || profile.id === "GM") continue;
        profiles[profile.id] = makePlayerProfile(profile.id, profile.name || profile.id);
      }
    }
    return profiles;
  } catch (error) {
    console.warn("Could not load profile registry.", error);
    return { ...USER_PROFILES };
  }
}

function saveProfileRegistry() {
  if (!window.localStorage) return;
  const userProfiles = Object.fromEntries(
    Object.entries(editorState.profiles)
      .filter(([profileId]) => profileId !== "GM")
      .map(([profileId, profile]) => [profileId, { id: profile.id, name: profile.name }]),
  );
  localStorage.setItem(PROFILE_REGISTRY_KEY, JSON.stringify(userProfiles));
}

function makeProfileId(name) {
  const asciiName = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const fallbackId = `player-${Date.now().toString(36).slice(-6)}`;
  const base = asciiName || fallbackId;
  let candidate = base;
  let index = 2;
  while (editorState.profiles[candidate]) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

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
  activeProfileId: localStorage.getItem(ACTIVE_PROFILE_KEY) || "GM",
  profiles: loadProfileRegistry(),
  enabled: false,
  blockBrush: "grass",
  selected: null,
  selectedToolbarIndex: 1,
  inventoryOpen: false,
  marketOpen: false,
  marketplaceOpen: false,
  marketTab: "buy",
  marketplaceTab: "buy",
  interiors: makeDefaultInteriors(),
  currencies: {
    gold: 205,
    premiumToken: 10,
  },
  gold: 205,
  marketplaceListings: MARKETPLACE_LISTINGS.map((listing) => ({ ...listing })),
  ownedAnimals: [],
  plantedTrees: [],
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

if (!editorState.profiles[editorState.activeProfileId]) {
  editorState.activeProfileId = "GM";
}


