# Tactics Block Terrain

Separate prototype for a 2.5D isometric block terrain renderer.

Includes an editor mode, farmable soil blocks, crop growth timers, and generated texture assets:

- `assets/grass-top.png`
- `assets/water-top.png`
- `assets/soil-top.png`

The farm also includes movable building footprints on visible grass tiles: a 2x2 house and a 3x3 barn, with sprites anchored to their occupied tiles.

The active user profile is `GM` (`Game Manager`), marked as the main persistent profile in the game state. Progress is saved in browser `localStorage` under the GM profile. GM is the only profile with permissions to shape elevated terrain and rotate the camera.

Large generated source images and verification screenshots live outside the lightweight runtime folder, in:

`C:\Users\eavm1\Desktop\coding\claude projects\VoiceType\tactics source image`

## Structure

- `game.js`: Phaser bootstrap only.
- `src/core/state.js`: constants, game data, UI handles, and mutable editor/profile state.
- `src/core/world.js`: terrain, camera transforms, save/load, buildings, placement, and pathing helpers.
- `src/scenes/farm-scene.js`: main farm scene renderer and farm interactions.
- `src/scenes/house-interior-scene.js`: house interior scene and movable furniture logic.
- `src/ui/panels.js`: editor controls, toolbar, inventory, market, stacking, buy/sell, and land expansion UI.
- `src/debug.js`: local testing hooks exposed as `window.__tacticsDebug`.

## Run

```powershell
cd "C:\Users\eavm1\Desktop\coding\claude projects\VoiceType\tactics"
npm start
```

Then open `http://127.0.0.1:4174`.

## Controls

- Click a tile: inspect terrain height/type
- E: toggle editor mode
- I: toggle inventory
- M: toggle market
- Camera button: rotate map view and show current angle
- Mouse wheel or +/-: zoom in/out
- WASD/arrows: move the position marker one tile
- Shift+click walkable tile: path the marker to that tile
- R: reset the scenario

In editor mode, clicking a block switches it to the selected material: grass, water, or soil. Clicking a block that already matches the selected material stacks it higher, and Shift+click lowers land. Click the house or barn in editor mode to pick it up, then click a valid 2x2 house or 3x3 barn destination to move it. In play mode, select a seed packet from the left toolbar to plant on soil, or select the hand tool to harvest mature crops into inventory. Items stack up to 99. Seed packets are consumed when planted. Open the market to buy seeds with gold, sell harvested produce, and buy land expansions that add more terrain. Double-click seed packets in inventory to move them into the toolbar. Double-click a toolbar seed packet to move it back only while the inventory is open. Crop timers keep advancing while editor mode is active.
