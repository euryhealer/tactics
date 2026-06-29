loadActiveProfileProgress();
window.addEventListener("beforeunload", saveActiveProfileProgress);

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1152,
  height: 704,
  backgroundColor: "#142027",
  pixelArt: false,
  scene: [TacticsScene, HouseInteriorScene],
};

const game = new Phaser.Game(config);
bindEditorUi();
