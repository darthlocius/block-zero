# Block Zero Release Checklist

Use this internal checklist before publishing a build. Record results separately for each candidate archive.

## 1. Static checks

Run from the project root:

```bash
node --check turret.js
node --check meta-progression.js
node --check grenade.js
node --check game.js
node --check input.js
node --check player.js
node --check enemy.js
node --check render.js
node --check bullet.js
node --check collision.js
node --check geometry.js
node --check main.js
node --check i18n.js
node --check storage.js
node --check wave-planning.js
node --check version.js
```

Also verify that `index.html` contains no duplicate DOM ids and that directly referenced `assets/...` paths exist.

### Automated regression tests

Run the full dependency-free regression suite before creating a release or tag:

```bash
node --test tests/*.test.mjs
```

The command must finish with exit code 0 and report no failed, cancelled, skipped, or todo tests.

## 2. Local launch

Start a local server:

```bash
python -m http.server 8000
```

or:

```bash
py -m http.server 8000
```

Open `http://localhost:8000` and confirm there are no console errors during bootstrap or asset loading.

## 3. Cache refresh

If code or assets appear stale, repeat the relevant check after one of:

- `Ctrl+F5`;
- `Ctrl+Shift+R`;
- DevTools → Network → Disable cache (while DevTools remains open).

## 4. Clean-profile reset

Targeted gameplay-profile reset (preserves the language preference and unrelated origin data):

```js
localStorage.removeItem("block-zero-meta-v1");
localStorage.removeItem("block-zero-achievements-v1");
localStorage.removeItem("block-zero-leaderboard-v1");
localStorage.removeItem("block-zero-player-name");
location.reload();
```

Full origin reset:

```js
localStorage.clear();
location.reload();
```

The full reset also deletes `blockZeroLanguage` and any other `localStorage` data belonging to the current origin. Use it only for an intentionally complete clean-origin test.

## 5. Main menu

- [ ] Only `v0.10.0-alpha` is visible as the build label; it is readable but unobtrusive.
- [ ] Build label does not behave like a button or intercept pointer input.
- [ ] EN is the default on a fully clean origin.
- [ ] EN/RU switching updates all visible menu and overlay text.
- [ ] EN weapon HUD and pickup banners never show Russian internal registry labels; RU uses the translated weapon names in both paths.
- [ ] Audio panel opens, closes, and applies master/music/effects levels.
- [ ] Fullscreen buttons enter/exit true fullscreen and report the correct state.
- [ ] Controls overlay opens and closes.
- [ ] General/Tactical Protocol, Armory, and Field Engineering upgrade views open and switch tabs.
- [ ] Synergy Guide opens and displays all five synergies.
- [ ] Achievements opens and displays 16 cards with correctly aligned icons.
- [ ] Hall of Fame opens, closes, and handles an empty list.

## 6. Clean honest run

Start after the targeted reset:

- [ ] A new run starts from the main menu without console errors.
- [ ] WASD and arrows move under EN and RU keyboard layouts.
- [ ] Mouse aiming remains accurate in windowed and fullscreen modes.
- [ ] Left mouse button and `Space` fire.
- [ ] `Shift` dashes only while movement input is active.
- [ ] Ordinary pickups collect automatically.
- [ ] A nearby weapon shows the prompt and equips only after holding `E`.
- [ ] A wave clears and proceeds through the augment-card flow.
- [ ] Reroll availability and remaining count match permanent upgrades.
- [ ] Expanded Selection shows four cards only when owned.
- [ ] Synergy Scanner hints appear only when owned.
- [ ] Swarm packs appear and enemies-remaining counting is sensible.
- [ ] A boss wave shows warning, HP bar, and defeated banner.
- [ ] A Tech-Priest appears naturally or through pity; its buff, shield, blaster, signal wave, removal, and loot work.
- [ ] Death sequence leads to a complete run summary.
- [ ] Run credits are awarded once and persist after reload.
- [ ] A qualifying achievement persists and its toast queues correctly.
- [ ] The run can be saved to Hall of Fame and its detail report is complete.
- [ ] Simulated `localStorage` write failure does not crash the game, language switch, or result screen.

### Run-results actions

- [ ] `Try Again` and `Upgrades` remain in the first horizontal row at normal panel width.
- [ ] `Main Menu` is centered in a second row, matches the secondary `Upgrades` style, and remains inside the panel in fullscreen and narrow layouts.
- [ ] EN shows `Main Menu`; RU shows `Главное меню`.
- [ ] `Main Menu` returns immediately through the normal results-to-menu path without starting a run, opening Upgrades, or saving a pending Hall of Fame result.
- [ ] Returning this way hides the combat HUD and clears weapon slots, Bastion-7 state, active run cheats, grenades/in-flight grenade state, pause state, and other run-only state.
- [ ] A result saved explicitly with `Save` remains in Hall of Fame after returning to the main menu.
- [ ] `Try Again`, `Upgrades`, and `Save` still perform their existing actions.

## 7. Dual weapon slots

### State, input, and HUD

- [ ] A new run starts on the pistol with both stored slots empty.
- [ ] Physical `Digit1` selects the pistol; `Digit2` and `Digit3` select occupied slots and do nothing for empty slots.
- [ ] Slot switching works under EN and RU layouts, only during `playing`, and does not affect text inputs or Forbidden Protocol entry.
- [ ] The bottom-left utility HUD is one horizontal row: Bastion-7, grenade counter, slot 2, then slot 3.
- [ ] Empty slots are visibly subdued, the active stored slot is highlighted, and pistol mode highlights neither stored slot.
- [ ] SMG, shotgun, and plasma slots show distinct CSS pictograms and the codes `SMG`, `12G`, and `PLS`.
- [ ] Grenade count, empty state, refill pulse, and empty pulse still behave as before.

### Pickup and replacement rules

- [ ] Hold `E` still uses a 56-unit radius, 0.35-second duration, prompt, and progress bar.
- [ ] The first unique pickup fills slot 2 and auto-equips; the second fills slot 3 and auto-equips.
- [ ] A duplicate switches to its existing slot, remains on the ground, and cannot retrigger until `E` is released.
- [ ] With both slots full, a unique pickup replaces the active stored slot.
- [ ] With the pistol active, a unique pickup replaces the last selected stored slot.
- [ ] No slot can contain the pistol and the two stored slots cannot contain duplicate weapon ids.

### Integrity and reset

- [ ] Actual weapon changes update `weaponsUsed` once and reset weapon-streak achievement tracking once.
- [ ] Reselecting the active slot and interacting with an already-active duplicate do not create false switch events.
- [ ] Mr. Wick and 12 Gauge Fury react only to real active-weapon changes.
- [ ] Final weapon and unique weapons used remain correct in run summary and Hall of Fame details.
- [ ] Death completion, abort, return to menu, and a new run clear both slots and restore the pistol.
- [ ] No weapon-slot state or new key is written to `localStorage`.
- [ ] Normal, narrow-window, and fullscreen layouts keep the utility HUD readable without critical overlap.

## 8. Cheated run

Internal codes may be used here. Suggested coverage:

- Main-menu codes: `GODMODE`, `TECHPRIEST`, `ARMORY`, or `SWARMHELL`.
- Pause-menu codes: `KILLALL`, `HEALME`, `TECHNOW`, or `NUKE`.

Run at least one main-menu protocol test and one pause-menu protocol test:

- [ ] Physical-code input works with both EN and RU keyboard layouts.
- [ ] A green activation toast appears and no visible input field is required.
- [ ] The affected run is marked as cheated in the results.
- [ ] The run cannot be added to Hall of Fame.
- [ ] Achievement changes from the run do not persist and pre-run progress is restored.
- [ ] No run earnings are awarded.
- [ ] Honest lifetime run/kill/best statistics do not change.
- [ ] Active run cheats clear after death, abort, or return to the main menu.
- [ ] The next normal run is honest and can save progression normally.

## 9. RICHMAN exception

- [ ] Enter `RICHMAN` from the unobstructed main menu.
- [ ] Exactly 1000 credits are added and persist.
- [ ] No current or next-run cheated status is set.
- [ ] A subsequent honest run awards credits, achievements, statistics, and Hall of Fame eligibility normally.

## 10. Targeted impact grenades

### Basic throw and HUD

- [ ] A new honest run starts with the bottom-left counter showing `×3`.
- [ ] Pressing the physical `G` key during play consumes one charge and creates exactly one grenade.
- [ ] The grenade follows a visible, non-instant arc and lands on its displayed marker.
- [ ] Impact produces a distinct green-white flash, two expanding rings, controlled particles, a decal, screen shake, and the existing explosion sound.
- [ ] Holding `G` does not consume multiple charges because repeated keydown events are ignored.
- [ ] EN and RU layouts use the same physical `KeyG` input.
- [ ] `G` does not throw from the main menu, pause, intermission, perk selection, death sequence, results, or a text input.
- [ ] Main-menu and pause-menu Forbidden Protocol input containing the letter G still works.

### Inventory and wave refill

- [ ] Three throws reduce the inventory to zero and a fourth attempt creates no grenade.
- [ ] At zero, the HUD changes to its empty style and plays the short empty pulse.
- [ ] Wave 1 grants no additional charge.
- [ ] Every later wave, including boss waves, restores exactly one charge when below maximum.
- [ ] Refill never raises the inventory above three and produces the green HUD pulse.

### Targeting, damage, and integrity

- [ ] Windowed and fullscreen throws land at the camera-correct world-space cursor position.
- [ ] Targets beyond 720 world units are clamped in the same direction, and the marker shows the clamped landing point.
- [ ] Center hits kill or heavily damage ordinary enemies and Swarm; edge hits deal visibly less damage.
- [ ] The grenade itself causes no direct player damage.
- [ ] Grenade-triggered barrel explosions retain their existing player-damage and chain-reaction behavior.
- [ ] Crates, long crates, barricades, walls, and barrels take grenade damage and retain normal score/drop behavior.
- [ ] Tech-Priest damage is absorbed by its shield first and reduced by armor afterward; one grenade does not kill it.
- [ ] Crowds do not block a grenade from damaging a Tech-Priest at the landing point.
- [ ] One grenade does not kill a boss, the boss HP bar updates, and boss knockback remains weak.
- [ ] Grenade kills count as normal honest kills and do not mark the run as cheated.
- [ ] Achievements, statistics, earnings, and Hall of Fame eligibility continue to work for honest grenade runs.
- [ ] No grenade inventory or flight state is written to `localStorage`.

### State and performance

- [ ] Pausing during flight freezes the grenade; resuming continues the same flight.
- [ ] Death, abort, run completion, and full return to the main menu clear all in-flight grenades.
- [ ] A subsequent new run starts again with three charges.
- [ ] Three quick throws do not cause a noticeable FPS drop, long-lived smoke, retained particles, or console errors.

## 11. Field Engineering — Bastion-7

- [ ] Physical `KeyQ` hold shows a camera-correct world-space preview; release deploys only at a valid point, while an invalid release leaves cooldown ready.
- [ ] Right Click and the first `Esc` cancel placement without deploying; pause/resume leaves no ghost preview.
- [ ] Range, full-footprint world bounds, 70-unit player clearance, live solids, living enemy overlap, and maximum-one-active validation all behave correctly.
- [ ] The real base remains stationary while the head rotates smoothly through right/down/left/up/diagonal targets without wobble; flash and bullet origin stay on the muzzle.
- [ ] Deploy lasts 0.45 seconds before firing; the sentry remains active for 30 seconds, sustains full-auto fire beyond 90 shots, and then fades without explosion, damage, or wreck.
- [ ] Cooldown remains inactive throughout deployment/active time, starts at the effective 30-to-24-second value only when the sentry deactivates, continues through simulation-time wave-clear/intermission phases, freezes in pause/perk selection, and plays ready feedback once.
- [ ] Nearest-visible targeting, sustained 0.10-second base full-auto cadence, target-loss/reacquire behavior, 600-unit range, distance spread, and actual-hit 0.60 boss damage behave as documented.
- [ ] Crates, long crates, concrete, barricades, walls, and barrels block turret bullets but lose no HP and trigger no barrel chain.
- [ ] Player and enemies pass through the sentry; enemies, Sniper, Tech-Priest, bullets, and grenades ignore it as a target/solid, and no friendly fire occurs.
- [ ] Turret kills retain ordinary kills/score/credits/combo/drop handling without adding a weapon id, `weaponsUsed` entry, weapon synergy, or persistence key.
- [ ] The CSS-native HUD card sits left of the grenade, transitions Active → Cooldown → Ready with active/cooldown time and no ammunition counter, remains readable in narrow and true 1920×1080 fullscreen layouts, and never uses the gameplay PNG as an icon.
- [ ] EN/RU controls, status accessibility labels, and `KeyQ` behavior have full parity; both turret PNG assets load with alpha and no black rectangle.
- [ ] Recoil/shake, head pivot, muzzle placement, deployment, and deactivation visuals remain unchanged during sustained fire.
- [ ] Sustained fire starts one decoded `bastion7-machinegun-loop.wav` source on the first real shot, uses runtime gain `0.432`, does not restart per shot, survives brief target switches without stutter, and stops cleanly without an audible seam/click when fire ends.
- [ ] The louder loop remains clear over battle music for 20–30 seconds, does not clip or overload the mix, and still obeys SFX volume and mute.
- [ ] Loop playback rate is `0.94` at Overdrive Motors 0, `1.0528` at level 3, and `1.128` at level 5, audibly following the 600-to-720 RPM gameplay cadence.
- [ ] The Bastion firing loop follows the existing SFX volume/mute path and leaves no source after pause, wave end, natural shutdown, death, retry, abort, reset, or menu return; the former per-shot synthetic cue is absent.
- [ ] Turret projectiles render as compact warm kinetic tracers aligned to their own velocity in every direction, with no green blob or beam-like trail; projectile physics, collisions, muzzle flash, and recoil/shake remain unchanged.
- [ ] Wave end immediately deactivates the sentry and starts a fresh effective cooldown; retry, death, abort, results-to-menu, and a new run fully reset active/preview/cooldown state to ready.
- [ ] The Field Engineering tab shows exactly Heavy Caliber, Overdrive Motors, and Rapid Redeployment with correct EN/RU names, descriptions, costs, level counters, purchase states, and MAX behavior.
- [ ] Heavy Caliber produces 10 damage through wave 4, 11.5 at wave 7, 14 at wave 12, and 18 at wave 20 before meta/Armory; level 5 multiplies those values by 1.30.
- [ ] Generic Armory damage stacks exactly once after wave and Heavy Caliber multipliers; actual boss hits then receive exactly ×0.60.
- [ ] Overdrive Motors level 5 uses about `0.08333` seconds per shot / 720 RPM without changing recoil, shake, muzzle, pivot, flash, tracer styling, or projectile cleanup.
- [ ] Rapid Redeployment levels 0/1/5 start cooldown at 30/28.8/24 seconds while active duration remains 30 seconds and the HUD begins from the real effective value.
- [ ] A pre-Field-Engineering `block-zero-meta-v1` save loads all old credits, levels, and lifetime statistics unchanged with the three new levels at 0; purchase/save/reload persists each new level under the same key.
- [ ] `node --test tests/*.test.mjs` passes the production-importing turret tests and all prior storage/collision/Sniper regressions.

## 12. Tech-Priest signal-wave rebalance

### First impact and telegraph

- [ ] Activate `TECHNOW` in a test run and confirm the Tech-Priest does not deal immediate signal-wave damage.
- [ ] The first telegraph begins 2.2–2.8 seconds after spawn, lasts about 0.85 seconds, and the first impact occurs about 3.05–3.65 seconds after spawn.
- [ ] The full 500-unit danger zone is visible on the ground and remains visible when the Tech-Priest's center is just outside the viewport.
- [ ] The outer dashed boundary becomes brighter as impact approaches.
- [ ] The inner green-blue energy ring contracts toward the Tech-Priest and flickers near completion.
- [ ] The ground effect does not cover enemy sprites, cover, or a flying grenade and does not cause a noticeable FPS drop.
- [ ] No damage occurs during the telegraph or while the impact ring expands.

### Audio and response

- [ ] A distinct synthesized warning sound plays exactly once when each charge starts.
- [ ] A separate synthesized impact sound plays when the charge completes and does not reuse the ordinary explosion sound.
- [ ] Both sounds obey the SFX volume control and are silent when SFX volume is zero.
- [ ] The player can move and dash during the telegraph and can leave the 500-unit radius before impact.
- [ ] Damage uses the player's position at impact rather than the position where the charge began.

### Tech-Priest behavior and cancellation

- [ ] Starting a charge cancels any unfinished five-shot blaster burst.
- [ ] The Tech-Priest neither starts a new burst nor releases remaining shots while charging.
- [ ] Ordinary movement continues at 55% speed while charging; weapon and grenade knockback are not reduced by this multiplier.
- [ ] Shield, armor, weapon damage, and ordinary damage intake behave as before.
- [ ] Killing the Tech-Priest with a weapon or grenade during the telegraph removes the warning and prevents the impact.
- [ ] Killing the Tech-Priest still removes its ally buff and preserves its existing reward and loot behavior.

### Damage and repeat timing

- [ ] On wave 6, damage before player defenses is approximately 23 at 0–180 units, 17 at 320, 14 at 400, and 9 at 500.
- [ ] The signal wave deals no damage beyond 500 world units.
- [ ] Armor, temporary reductions, dash immunity, invulnerability, and Second Wind still apply through the normal player-damage path.
- [ ] The next telegraph begins 4.0–5.2 seconds after impact and releases 0.85 seconds later.
- [ ] Consecutive impacts are about 4.85–6.05 seconds apart, and multiple impacts cannot start in the same frame.
- [ ] Tech-Priest HP, shield, armor, blaster stats, ally-buff coefficients, spawn chance, pity logic, spawn timing, rewards, and loot are unchanged.

## 13. Sniper

### Spawn planning and reset

- [ ] Waves 1–4 and every boss wave plan and spawn no Snipers.
- [ ] Waves 5–7 use the 40% one-Sniper chance, never exceed one active Sniper, and suppress Sniper planning when a Tech-Priest is planned.
- [ ] Non-boss waves 8–11 use the 65% one-Sniper chance and can contain both a Sniper and Tech-Priest.
- [ ] Non-boss waves 12+ always plan one Sniper, sometimes plan a later second at 35%, and never exceed two active Snipers.
- [ ] The first Sniper replaces a regular slot around 22–42% of the roster; the second replaces a later slot around 62–82% without sharing a frame or spawn point.
- [ ] A new run, death/results flow, abort, and full return to the main menu clear all aim lines, beam visuals, cooldown/lock state, old planning, and the one-run detection-banner flag.

### Asset, scale, radar, and localization

- [ ] `assets/images/enemies/sniper.png` loads without an asset error and has no opaque black square.
- [ ] The Sniper sprite is visibly larger than Hellhound, Orb, Tank, and Swarm, but smaller than the Tech-Priest and bosses.
- [ ] The square sprite keeps its proportions and horizontal reflection.
- [ ] The scarlet diamond/ring radar marker is clearer than a normal enemy point and smaller than the Tech-Priest marker.
- [ ] The first actual Sniper spawn shows the localized EN/RU detection banner exactly once per run.

### Tracking, lock, hit, and cover

- [ ] Tracking lasts about 1.03 seconds within the total 1.35-second warning, follows the player with a readable layered dark-red/scarlet line, permits limited Sniper movement, and deals no damage.
- [ ] The final 0.32-second lock is clearly thicker and brighter than tracking, fixes direction, stops the Sniper, and still deals no damage.
- [ ] Ordinary movement and dash can leave the fixed line before the shot.
- [ ] The actual beam is unmistakably thicker and more powerful than both warning phases, with a dark-scarlet outer stroke, dominant `#ff2400` body, bright hot center, controlled muzzle/impact flashes, modest screen shake, and no full-screen flash.
- [ ] A direct unobstructed hit calls the normal player-damage path once.
- [ ] Crates, long crates, concrete walls, barricades, barrels, and other live destructible solids stop the line and beam at the first intersection; the player behind cover takes no damage.
- [ ] Losing line of sight during tracking cancels the shot and causes repositioning.
- [ ] Killing the Sniper during tracking or final lock cancels the shot and leaves no warning line, delayed damage, or continuing sound.
- [ ] The Sniper has no contact damage even when the player stands inside its collision radius.

### Balance, Tech-Priest, audio, and performance

- [ ] Base stats before wave scaling are 180 HP, 34 damage, 86 speed, 27 radius, 42 reward, and 4.4-second attack cooldown.
- [ ] Preferred range is 520–720, hard retreat begins inside 300, acquisition is limited to 280–820, and beam range is 980.
- [ ] Post-shot cooldown is 3.8–5.0 seconds and reposition lasts 0.9–1.35 seconds.
- [ ] Tech-Priest empowerment affects normal Sniper HP/damage/movement/recovery values but never shortens the 1.35-second warning or 0.32-second final lock.
- [ ] Aim-start, lock, and shot cues are distinct, obey SFX volume, are silent at zero SFX, and leave no looping node after death.
- [ ] One and two-Sniper fights remain readable in windowed mode and true 1920×1080 fullscreen without new console errors or a noticeable FPS drop.

## 14. Display modes

- [ ] Non-fullscreen layout is usable at the normal viewport size.
- [ ] True fullscreen resizes the real canvas and reveals more world area.
- [ ] 1920×1080 fullscreen is readable.
- [ ] A reduced browser window remains usable without horizontal page scroll.
- [ ] DOM HUD and canvas boss/bonus UI do not overlap critically.
- [ ] Enemies are not hidden behind the HUD without readable radar/threat feedback.
- [ ] Crosshair and shots align with the pointer after resize and fullscreen transitions.
- [ ] Main menu, overlays, and version label do not introduce horizontal scroll.

## 15. Final release gate

- [ ] All syntax checks pass.
- [ ] `node --test tests/*.test.mjs` passes with no failed, cancelled, skipped, or todo tests.
- [ ] Manual smoke test passes.
- [ ] Clean-profile test passes.
- [ ] Honest-run test passes.
- [ ] Cheated-run isolation test passes.
- [ ] `RICHMAN` exception test passes.
- [ ] EN/RU test passes.
- [ ] Windowed/fullscreen test passes.
- [ ] Git diff has been reviewed and contains no unintended gameplay or asset changes.
- [ ] A recoverable archive backup exists.
- [ ] `v0.10.0-alpha` is visible in the main menu.
- [ ] `CHANGELOG.md` matches the candidate build.
