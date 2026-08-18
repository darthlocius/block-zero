# Block Zero — Project Context

## 1. Project identity

Block Zero is a browser-based top-down wave-survival shooter built with HTML, CSS, and vanilla JavaScript. Its visual direction is dark science fiction set among industrial ruins: the battlefield stays muted while enemies, pickups, projectiles, effects, and UI use brighter accents for readability.

This is the author's first serious game project. A future Steam release is a possible long-term direction, not a confirmed release commitment.

## 2. Current build

```text
Current version: 0.10.0-alpha
Development status: Alpha
```

The current build is a working development build. Its core loop—fight a wave, clear it, choose an augment, and continue into a harder wave—is functional. There is no final victory condition or Victory Screen, so a normal run continues until the player dies or ends the run. The game currently uses one primary battlefield layout, with procedural terrain details and additional destructible objects placed during waves.

## 3. Tech stack and launch

- HTML, CSS, and vanilla JavaScript.
- Canvas-based world rendering plus DOM-based menus and overlays.
- Native ES modules.
- No build step and no npm dependencies.

Run a local HTTP server from the project root:

```bash
python -m http.server 8000
```

or:

```bash
py -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not use direct `index.html` opening as the recommended launch path. After asset changes, use `Ctrl+F5`, `Ctrl+Shift+R`, or disable the browser cache while testing.

Automated regression tests use the native Node.js `node:test` runner with no external test dependencies. Run the deterministic suite from the project root:

```bash
node --test tests/*.test.mjs
```

The current suite covers safe storage behavior, segment/rectangle collision geometry, Sniper wave planning, and the Bastion-7 pure core. Wave planners and automated combat helpers must preserve injectable random functions and visibility predicates as required testability seams; tests must never depend on uncontrolled `Math.random`. Pure gameplay helpers should remain importable without DOM/browser bootstrap where practical.

## 4. File map

- `version.js` — single source for the public build version and label.
- `main.js` — bootstrap, animation loop, and high-level update ordering.
- `game.js` — shared DOM references, game and run state, content definitions, assets/audio, bonuses, synergies, achievements, meta progression, Hall of Fame, menus, run lifecycle, and common helpers.
- `meta-progression.js` — dependency-free permanent upgrade registry, cost/purchase rules, and backward-compatible meta-save normalization.
- `input.js` — keyboard and pointer input, fullscreen control, menu wiring, audio controls, and internal Forbidden Protocol entry handling.
- `turret.js` — dependency-free Bastion-7 configuration, ability runtime, placement validation, cooldown/lifetime updates, spread, targeting, rotation, and full-auto logic.
- `player.js` — player movement, firing trigger, ordinary pickup collection, and hold-to-equip weapon handling.
- `enemy.js` — wave creation, spawning, enemy and boss behavior, Swarm packs, Sniper hitscan logic, Tech-Priest support logic, and wave completion.
- `render.js` — canvas rendering for the map, actors, Sniper telegraphs/beams, effects, pickups, radar, crosshair, banners, and boss UI.
- `bullet.js` — player/enemy projectiles, weapon fire, dash, hit processing, and projectile-driven synergy effects.
- `collision.js` — actor/solid collision, destructible damage, projectile obstruction, and barrel explosion damage; it consumes and re-exports the pure segment/solid helper.
- `geometry.js` — dependency-free segment/rectangle intersection geometry shared by production collision code and Node regression tests.
- `wave-planning.js` — dependency-free Sniper wave-slot planning and its pure constants, shared by production enemy spawning and Node regression tests.
- `i18n.js` — EN/RU strings, language persistence, translation helpers, and static DOM translation.
- `storage.js` — dependency-free safe wrappers for browser persistence reads, writes, and removals.
- `tests/` — deterministic native Node.js regression tests for storage safety, collision geometry, Sniper wave planning, and Bastion-7 core behavior.
- `index.html` — DOM structure for the canvas, HUD, main menu, modals, pause screen, results, achievements, and Hall of Fame.
- `style.css` — layout and presentation for DOM UI, overlays, responsive states, and fullscreen behavior.
- `assets/` — images, music, and sound effects loaded directly by the game.
- `docs/` — internal project context and release verification documents.

## 5. Absolute guardrails

- Do not recreate a legacy `script.js` or rewrite the modular architecture.
- Preserve separation between world coordinates, camera coordinates, and screen/pointer coordinates.
- Fullscreen must use the Fullscreen API and resize the real canvas; do not replace it with CSS-only scaling.
- Preserve pointer accuracy after canvas or camera changes.
- Keep all persistent storage backward-compatible. Do not rename or clear keys without an explicit migration task.
- Route persistent reads, writes, and removals through the safe helpers in `storage.js`; storage failures must not interrupt UI or gameplay flows.
- Render visible weapon names through `weaponLabel(id)` / `i18n.js`, never directly from internal weapon registry labels.
- Maintain complete EN/RU UI coverage and keep EN as the default language.
- Keep DOM ids unique.
- Fullscreen is controlled through UI buttons, never the `F` key.
- Do not change the weapon pickup radius or hold duration unless specifically requested.
- Do not change gameplay balance during UI or documentation work.
- Achievements are trophies and must not grant credits, stats, or combat rewards.
- Cheated runs must not enter honest statistics, earnings, achievements, or Hall of Fame records.
- Avoid speculative refactors and unrelated asset, sound, or music changes.
- `game.js` remains intentionally broad for now; do not mass-refactor it as part of unrelated maintenance.
- Future systems should avoid adding unnecessary responsibilities to `game.js`. Field Engineering and turret logic must live in a separate module rather than being placed wholesale into `game.js`.

Repository and rights:

- The public repository is source-available.
- `ASSET_RIGHTS.md` defines permissions for source code, visual assets, music and audio, and documentation.
- Public repository access does not grant permission to reuse or redistribute its contents.
- Do not add an open-source license without a direct decision from the project author.

## 6. Persistent storage

The game currently uses these `localStorage` keys:

| Key | Purpose |
| --- | --- |
| `block-zero-meta-v1` | Credits, lifetime run statistics, and all permanent upgrade levels. |
| `block-zero-achievements-v1` | Achievement unlock timestamps and persistent kill/Swarm/barrel counters. |
| `block-zero-leaderboard-v1` | Hall of Fame run records. |
| `block-zero-player-name` | Last name entered for a Hall of Fame record. |
| `blockZeroLanguage` | Selected `en` or `ru` interface language. |

Older Hall of Fame records may lack newer fields such as `creditsEarned`, `creditsTotal`, `weaponsUsed`, `synergies`, `duration`, `maxCombo`, or `endReason`. Loading and display code must continue to normalize absent fields safely. Do not change key names or serialized formats without a separate, backward-compatible migration.

All key names and JSON schemas above remain backward-compatible. Storage failures use fallback values or a `false` write/remove result and do not trigger migration, data clearing, or runtime failure.

## 7. Controls and input

Gameplay controls use physical `event.code` mappings where layout independence matters, so movement and internal code entry work under both EN and RU keyboard layouts.

- `W`, `A`, `S`, `D` (`KeyW`, `KeyA`, `KeyS`, `KeyD`) or arrow keys — move.
- Mouse — aim.
- Left mouse button or `Space` — fire.
- Left or right `Shift` — dash in the current movement direction; dash requires movement input and has a cooldown.
- `1` (`Digit1`) — switch to the always-available pistol.
- `2` (`Digit2`) — switch to stored weapon slot 2 when occupied.
- `3` (`Digit3`) — switch to stored weapon slot 3 when occupied.
- Hold `E` (`KeyE`) near a weapon pickup — equip it. The current hold duration is 0.35 seconds and the interaction radius is 56 world units.
- `G` (`KeyG`) — throw a targeted impact grenade toward the world-space cursor.
- `Q` (`KeyQ`) — hold to preview Bastion-7 placement at the world-space cursor and release to deploy; keyboard layout does not affect the physical key.
- Right Click or `Esc` while the placement preview is active — cancel placement without deploying or starting cooldown. Placement cancellation consumes the first `Esc` instead of also opening pause.
- `Esc` — pause/resume an active run, close the topmost menu overlay, return from results, or confirm the finished death sequence where applicable.
- Fullscreen — UI buttons only.

The pointer is converted from CSS pixels into real canvas coordinates, then into camera-relative world coordinates. Preserve this path when changing layout or fullscreen code.

## 8. Targeted impact grenades

- Grenade input uses the physical `event.code === "KeyG"`, so the same physical key works under EN and RU layouts.
- A new run starts with 3 charges, the maximum inventory is 3, and one charge is restored at the start of every wave after the first when the inventory is not full.
- The target is calculated from `world.pointer` in world coordinates and clamped to a maximum throw range of 720 world units.
- Flight uses a visible ballistic arc with a landing marker; grenades ignore enemies and solids until exploding at the calculated landing point.
- The explosion radius is 230 world units with 460 center damage and linear falloff to 45% damage at the edge.
- Bosses receive 30% grenade damage. The Tech-Priest is not given a special damage modifier: its existing shield and armor remain authoritative through `applyDamageToFoe(...)`.
- Grenades damage destructible cover through `damageSolid(...)`, including barrels and their existing secondary explosions.
- The grenade itself causes no direct self-damage. A barrel detonated by a grenade can still damage the player under the existing explosion rules.
- Grenade kills use the normal `cleanupDeadFoes()` and `awardKill(...)` path and remain eligible for honest achievements and statistics.
- Grenade inventory and in-flight state are run-local and are not written to `localStorage`.
- There are no grenade meta-upgrades and no random grenade pickups in this build.

## 9. Field Engineering — Bastion-7

Bastion-7 Sentry / `Турель «Бастион-7»` is the Field Engineering active ability. Its internal id is `bastion7`. The existing permanent meta screen includes a three-upgrade Field Engineering branch for this ability. This version still includes only the machine-gun sentry: there is no grenade turret, second device, repair, pickup, charge inventory, new currency, dedicated persistence key, or Field Engineering achievement.

### Architecture and ownership

- `turret.js` is dependency-free and owns the frozen config, Field Engineering formulas, run-state factory/reset, pure placement validation, cooldown/lifetime updates, wave/damage/boss scaling, distance spread, nearest-visible targeting, turn interpolation, full-auto cadence, audio-rate math, and shot descriptors.
- `meta-progression.js` owns the existing registry and generic state/cost/purchase helpers. The Field Engineering ids are `field_heavy_caliber`, `field_overdrive_motors`, and `field_rapid_redeployment`; all use the existing credit balance and `block-zero-meta-v1` save.
- `game.js` owns DOM references and stores one `world.turretAbility` run-state object. Existing lifecycle functions reset or stop it on wave clear, death, abort, retry, results/menu return, and new-run reset.
- `main.js` injects the existing `firstSolidIntersection(...)` LOS path, `projectile(...)` creation, firing-loop state updates, current wave, Field Engineering levels, world collections, and `getMetaArmoryDamageMultiplier()` into the turret core. `turret.js` never imports `game.js`, `bullet.js`, or browser APIs, so this dependency direction creates no import cycle.
- `bullet.js` records `source: "turret"`. Turret projectiles use the ordinary friendly projectile array and enemy hit/death path, but skip weapon execution bonuses, weapon knockback, weapon synergies, and weapon ids. They stop on live solids through the existing collision helper while explicitly suppressing `damageSolid(...)`.
- `render.js` consumes frozen rendering metadata and the two manifest assets. The persistent HUD pictogram is CSS-native and does not use either gameplay PNG.

### Runtime and placement

- Every run starts ready with cooldown 0, no active sentry, no placement preview, and no ready sound.
- Hold physical `KeyQ` during `playing` to show the real base/head sprites at the camera-correct world cursor. Release `Q` to attempt deployment. Right Click or `Esc` cancels; a cancelled or invalid attempt leaves cooldown at 0.
- Placement range is 480 world units. The full 42-unit footprint must remain inside world bounds, stay at least 70 units from the player, avoid all live solid rectangles, avoid physical overlap with living enemies, and require that no Bastion-7 is already active.
- The sentry is never added to destructible solids or actor collision. It provides no cover and does not block players, enemies, bullets, grenades, Hunter Drones, Sniper beams, or Tech-Priest attacks.
- Successful deployment starts a 30-second active timer with unlimited ammunition and leaves cooldown inactive at 0. Natural expiry begins deactivation and the effective post-deactivation cooldown at the same simulation instant. The base cooldown is 30 seconds; Rapid Redeployment reduces it by 4% per level to 24 seconds at level 5 without changing active duration. Cooldown advances on simulation `dt` during `playing`, `intermission`, and the short `wave_clear` sequence; it freezes during pause, perk selection, death sequence, gameover, and menus.
- Wave completion immediately removes an active sentry, discards any unused active time, starts the existing deactivation visual, and sets the same effective post-deactivation cooldown. Death, abort, retry/new run, and menu return reset the complete run-only ability state to ready with cooldown 0.

### Combat

- After a 0.45-second deploy phase, Bastion-7 selects the nearest living visible enemy within 600 units. Visibility is evaluated with existing live-solid segment intersection; there are no special enemy priorities.
- While a valid target remains aligned, Bastion-7 fires continuously at a base 0.10-second interval with no burst counter or burst pause. Overdrive Motors adds 4% fire rate per level through `effectiveShotInterval = 0.10 / (1 + 0.04 × level)`, reaching about 0.08333 seconds and 720 RPM at level 5. A dead, out-of-range, or newly occluded target stops fire; the sentry reacquires the nearest visible target and resumes after ordinary aim alignment without an artificial delay.
- The head turns at 8 radians/second and fires when it is within 0.14 radians of the current target direction. It holds its last angle without a target.
- Visible projectiles travel at 900 units/second and deal base damage 10. Wave scaling is `1 + 0.05 × max(0, wave - 4)`; Heavy Caliber adds `1 + 0.06 × level`; the existing `getMetaArmoryDamageMultiplier()` remains the only generic Armory factor. Normal damage is `base × wave × Heavy Caliber × Armory`. Spread is ±7° through 250 units and interpolates to ±11° at 600 units. There is no predictive lead.
- Actual boss hits apply the explicit 0.60 multiplier after normal calculated turret damage. Ordinary enemy death still reaches `awardKill(...)`, preserving kills, score, credits, combo, and ordinary pickup behavior without adding `turret` to `weaponsUsed` or assigning a weapon id.
- Turret bullets disappear on crates, long crates, concrete, barricades, barrels, and other live solids. They never reduce solid HP or trigger barrel chains. There is no friendly fire and the sentry has no HP, health bar, enemy aggro, or enemy target-selection role.

### Rendering, HUD, audio, and assets

- `assets/images/allies/turret-base.png` is stationary. `assets/images/allies/turret-head.png` rotates freely with asset angle 0 aligned to world +X.
- Both 1254×1254 sprites render at a 92-unit square. The head pivot is explicit at normalized `(430/1254, 644/1254)` and the muzzle offset is `(738/1254, 0)` of render size from that pivot. Projectile origin and the short warm muzzle flash use the rotated muzzle offset.
- Deployment eases from scale 0.72/alpha 0.55 to full size/alpha over 0.45 seconds with a restrained acid-green activation ring. Expiry uses a 0.28-second fade/spark deactivation without explosion, AoE, or wreck.
- The preview uses both real sprites at alpha 0.48, a subtle 480-unit player radius, and green/red footprint feedback. Range circles are not retained after deployment.
- The DOM HUD card sits immediately left of the grenade card, followed by weapon slots 2 and 3. Its CSS-only line pictogram, `Q` keycap, border, glow, typography, progress bar, ready/placement/active/cooldown states, final-three-second pulse, and ready flash reuse the established acid-green utility-card language. Active shows whole remaining seconds and lifetime progress; cooldown shows `ceil(cooldown)` after shutdown.
- `assets/audio/bastion7-machinegun-loop.wav` is fetched once, decoded once into an `AudioBuffer`, and played through the existing SFX gain bus only while actual sustained firing is active. Runtime gain is `0.432` (1.8× the previous `0.24`). Baseline playback rate remains `0.94` and follows Overdrive Motors through `0.94 × fireRateMultiplier`, reaching `1.128` at level 5. The existing 15 ms fade-in, 30 ms fade-out, 80 ms target-switch hold, lifecycle cleanup, SFX volume, and mute paths are unchanged.
- `render.js` selects Bastion projectiles only through `source: "turret"` and draws a compact velocity-aligned warm white/yellow/gold tracer with an orange outer glow. `bullet.js` uses matching small warm impact sparks; projectile position, radius, speed, lifetime, collision, damage, and attribution are unchanged.
- Run-only Bastion-7 state is never written to `localStorage`. Permanent Field Engineering levels use the unchanged `block-zero-meta-v1` object; old saves without the three ids normalize them to level 0 while preserving credits, existing levels, and lifetime statistics.
- Bastion-7 recoil/shake, sprite pivot, muzzle offset, muzzle flash, sprite render size, bullet origin, deploy/deactivation visuals, and established turret/HUD rendering are intentionally frozen unless a future task explicitly requests them.

## 10. Current stable systems

The current build includes:

- main menu and local EN/RU switching;
- controls overlay and audio settings;
- windowed mode and true fullscreen with real canvas resizing;
- upgrades, General/Tactical Protocols, and Armory tabs;
- wave-based survival with intermissions and augment cards;
- rarity-weighted wave bonuses, rerolls, Expanded Selection, and Synergy Scanner;
- Synergy Guide, progress hints, activation banners, and an active-synergy panel;
- achievements with progress cards and queued unlock toasts;
- Hall of Fame and detailed run reports;
- run summary, pause menu, abort flow, and death sequence;
- internal Forbidden Protocols and cheated-run progression protection;
- boss warning, boss HP bar, and boss-defeated banner;
- motion radar and enemies-remaining display;
- automatic consumable pickups and hold-to-equip weapon pickups;
- two run-only stored weapon slots with direct `1` / `2` / `3` switching;
- Hunter Drone support;
- targeted impact grenades with a three-charge HUD inventory;
- destructible cover, crates, and explosive barrels;
- long-range Snipers with cover-blocked telegraphed hitscan attacks;
- eight rotating battle music tracks.

## 11. Weapons

There are four active weapon definitions:

- `pistol` — Pistol;
- `smg` — SMG Viper / `SMG "Гадюка"`;
- `shotgun` — Bulldog-8 Shotgun / `Бульдог-8`;
- `rail` — 40 Wt Plasma Rifle / `Плазменная винтовка 40 Wt` (the Coil Lance family is still reflected in asset/audio filenames).

The existing `player.weapon` field remains the single source of truth for the active weapon. The pistol is always available on `1` and does not consume a stored slot. Keys `2` and `3` select two run-only slots that can hold `smg`, `shotgun`, or `rail`.

Weapon pickups still require holding `E`. A new weapon fills the first empty slot from left to right and is equipped immediately. When both slots are occupied, a new pickup replaces the active stored slot; if the pistol is active, it replaces the last selected stored slot. Stored duplicates are forbidden: interacting with a duplicate switches to its existing slot and leaves the pickup on the ground. Slots are cleared on run reset, death completion, abort, and full return to the main menu. They are never written to `localStorage`.

The internal `ARMORY` protocol continues to create nearby pickups for the three non-default weapons; it does not bypass slot rules.

## 12. Enemies

- **Hellhound** (`animal`) — fast melee pursuer that closes on the player and attacks at contact range.
- **Orb** (`monster`) — slower ranged enemy that tries to keep distance and fires explosive projectiles.
- **Tank** (`criminal`) — ranged pressure unit that strafes and fires cannon-like shots.
- **Swarm** (`swarm`) — fragile, fast melee creature deployed in packs; packs begin appearing from wave 2.
- **Tech-Priest of the Swarm** (`techpriest`) — special support enemy that empowers ordinary allies while it lives.
- **Sniper** (`sniper`) — long-range ordinary enemy that telegraphs and then fires a fixed-direction scarlet hitscan beam.

### Tech-Priest behavior and balance

- Eligible from wave 5 and absent from boss waves.
- At most one Tech-Priest is planned/spawned in a wave.
- Natural chance is 30% before wave 8 and 50% from wave 8 onward.
- Pity logic forces a spawn after three missed eligible waves.
- Spawns partway through the regular wave roster and immediately empowers eligible living allies; later spawns are empowered while the support effect remains active.
- Empowerment increases HP, damage, ranged attack pressure, and melee pressure.
- Uses a shield equal to 115% of its scaled HP and then 30% armor damage reduction after the shield breaks.
- Fires five-shot blaster bursts and periodically charges a telegraphed signal wave.
- Its death removes empowerment from surviving enemies.
- Its death always produces at least one guaranteed pickup, with chances for extra guaranteed loot and a weapon pickup.
- The current balance is considered successful and should not be changed incidentally.
- The current empowered-enemy glow is cached and arc rendering is budgeted for performance, but its art direction is provisional.

Empowerment coefficients verified in `enemy.js`:

```text
HP multiplier: 1.65
Damage multiplier: 1.50
Ranged cooldown multiplier: 0.65
Melee speed multiplier: 1.14
Melee cooldown multiplier: 0.68
```

#### Tech-Priest Signal Wave

Signal-wave parameters:

```text
Radius: 500
Inner full-damage radius: 180
Edge damage ratio: 0.40
Base damage: 18
Damage per wave: 0.8
Telegraph duration: 0.85 seconds
First cooldown: 2.2–2.8 seconds before telegraph
Repeat cooldown: 4.0–5.2 seconds before telegraph
Charge movement multiplier: 0.55
```

- Signal-wave damage occurs only after the telegraph completes.
- The player's current position is evaluated at the instant of impact, so the player can leave the marked area before the wave is released.
- Damage remains full within 180 world units, falls off linearly toward the edge, and reaches 40% at 500 world units.
- The charge warning and impact sounds are synthesized through the existing Web Audio API and obey SFX volume.
- The Tech-Priest stops firing and moves at 55% of its ordinary movement speed while charging, but remains damageable with its existing shield and armor.
- Killing the Tech-Priest during the telegraph cancels the pending impact.
- Cover does not currently block the signal wave.
- Maximum close-range damage remains unchanged.

### Sniper behavior and balance

The Sniper is an ordinary, non-boss enemy registered as `sniper`. Its asset is loaded through `enemy_sniper` from `assets/images/enemies/sniper.png` and rendered as a square at sprite scale `3.45`. It has a distinct scarlet diamond/ring motion-tracker marker.

Base stats:

```text
HP: 180
Damage: 34
Speed: 86
Radius: 27
Reward: 42
Attack cooldown baseline: 4.4 seconds
Combo gain: 0.32
Pickup chance multiplier: 0.65
Color: #ff2400
Flesh: #1b1215
Blood: #ff493d
```

Normal wave HP and damage scaling apply. The Sniper has no shield, armor, melee/contact attack, explosion, teleport, invisibility, summons, or dedicated progression. Kills use the ordinary `awardKill(...)` path.

Wave planning:

- Boss waves, waves 1–4, boss minions, and Swarm packs never contain a Sniper.
- On waves 5–7, there is a 40% chance to plan one; a planned Tech-Priest suppresses this early Sniper.
- On non-boss waves 8–11, there is a 65% chance to plan one, and it may coexist with a Tech-Priest.
- On non-boss waves 12+, one is guaranteed and a second has a 35% chance.
- At most one Sniper is active through wave 11 and at most two are active from wave 12 onward.
- The first planned Sniper replaces one regular spawn slot at 22–42% of the regular roster. A planned second replaces a later slot at 62–82%.
- Each Sniper increments `regularSpawned` once; planning never increases `regularTotal`.

Positioning:

```text
Preferred distance: 520–720
Hard retreat distance: 300
Attack acquisition distance: 280–820
Tracking movement cap: 22% of current speed
Post-shot reposition: 0.9–1.35 seconds
```

The Sniper approaches beyond 720, strafes at its preferred range, retreats while strafing inside 520, and retreats aggressively inside 300. Movement uses `moveActor(...)`, respects live solids, and adds edge pressure to avoid remaining pinned to world bounds.

Attack cycle:

```text
Total aim warning: 1.35 seconds
Tracking phase: 1.03 seconds
Final fixed lock: 0.32 seconds
Beam visual lifetime: 0.12 seconds
Post-shot cooldown: random 3.8–5.0 seconds
Maximum beam range: 980
Beam color: #ff2400
```

- Acquisition requires a living Sniper, no cooldown, a player inside 280–820, and clear line of sight.
- The layered dark-red tracking line follows the player and deals no damage. Its dark outer stroke and restrained scarlet core keep it readable without competing with the fired beam. Losing line of sight cancels the attack, adds a 0.8–1.1-second delay, and starts repositioning.
- During the final 0.32 seconds, the direction is fixed, the Sniper stops, and a thicker, brighter layered lock line no longer follows the player.
- The fired beam is an immediate hitscan along that saved direction. Its heavy dark-scarlet outer stroke, dominant `#ff2400` body, and bright hot center clearly exceed both warning phases. Player-circle intersection must occur before the nearest living solid intersection to deal damage.
- Crates, long crates, concrete walls, barricades, barrels, and other live destructible solids block the beam. The beam stops at the first hit without damaging or detonating the cover.
- Damage is applied once through `damagePlayer(...)`, preserving dash immunity, invulnerability, armor, Second Wind, god mode, death handling, and screen effects.
- Death during tracking or final lock clears the attack state, so no delayed shot remains. A released beam is only a short visual entry and cannot deal repeat damage.

Tech-Priest empowerment treats the Sniper as an ordinary ranged target. Existing coefficients may increase HP and damage and shorten its recovery cooldown, but the 1.35-second warning and 0.32-second fixed lock are constants and are never shortened. The Sniper's first-spawn banner and beam state are run-local, cleared on a new run, death/results, abort, and return to the main menu, and introduce no new `localStorage` key.

## 13. Bosses

Boss waves occur every fourth wave. The following three templates rotate cyclically:

- `alpha` — Megabrain / Мегамозг;
- `abomination` — Abomination / Отродье template, currently displayed as Biomass / Биомасса;
- `warlord` — Warlord / Повелитель битвы template, currently displayed as Overlord / Оверлорд.

Boss waves display a warning, an HP bar, and a defeated banner. They do not allow a Tech-Priest. Current bosses have distinct attacks and summoning behavior, but their behavior depth is still intended to expand in a later Enemy Evolution stage.

## 14. Wave progression

- Runs start with an intermission, then advance through numbered survival waves.
- Enemy totals, spawn cadence, HP, damage, and some movement scale with wave number.
- Hellhound is present first; Tank enters the pool at wave 2 and Orb at wave 3.
- Swarm packs begin at wave 2 and their target count rises through later wave bands.
- Every fourth wave includes one of the three cyclic bosses.
- Eligible non-boss waves can contain a Tech-Priest, including pity-spawn handling.
- Snipers use separately planned regular spawn slots from wave 5 onward and never appear on boss waves.
- Clearing a wave starts a short clear sequence followed by augment selection and the next intermission.
- There is no final victory and no fully role-based Wave Director yet.

## 15. Wave bonuses

The current `waveBonuses` registry contains **33** `createWaveBonus(...)` entries. Bonuses have rarity, weighting, tags, localized title/description data, and availability conditions where relevant. The system supports:

- common, rare, epic, and legendary rarity;
- rerolls from the permanent Reroll Protocol;
- three choices by default or four with Expanded Selection;
- build tags and Synergy Scanner hints;
- temporary next-wave modifiers and persistent run modifiers;
- weapon-specific and general combat/utility bonuses.

Do not duplicate all bonus definitions in documentation; `game.js` remains the source of truth for their exact effects.

## 16. Synergies

There are five current synergies:

- Bullet Storm;
- Shock Corridor;
- Crowd Control;
- Scavenger Loop (localized UI currently uses “Scavenger Cycle” in EN);
- Hunter Swarm.

Synergies activate when the acquired augment tag counts satisfy their requirements. The UI provides a guide, progress hints, an activation banner, and an active-synergy panel.

Target frequency for build feel:

- one synergy in a normal good run is expected;
- two are realistic;
- three are possible in a lucky, coherent build.

## 17. Meta progression

There are **20** permanent `metaUpgrades`: 11 in the General/Tactical Protocols group, 6 in Armory, and 3 in Field Engineering. Heavy Caliber adds 6% Bastion damage per level, Overdrive Motors adds 4% Bastion fire rate per level, and Rapid Redeployment reduces Bastion cooldown by 4% per level; each is capped at level 5.

Meta progression uses credits, upgrade levels/costs, lifetime run statistics, and `block-zero-meta-v1` persistence. The Field Engineering entries reuse existing cost curves: Armory Damage for Heavy Caliber, Armory Fire Rate for Overdrive Motors, and Armory Range for Rapid Redeployment. Missing new ids default to 0 during normalization and appear on the next save without resetting old data. Never reset credits, levels, or saved statistics without an explicit request. Preserve all existing costs and effects unless a dedicated balance task says otherwise.

## 18. Achievements

The game has **16** achievements. They are stored separately under `block-zero-achievements-v1` and use:

- persistent counters for kills, Swarm kills, and destroyed barrels;
- per-run wave, weapon-streak, Swarm, barrel, synergy, boss, and no-damage checks;
- a queued toast system;
- a 4×4 spritesheet at `assets/images/ui/achievement_icons_sheet.png`;
- `iconIndex` values 0–15 mapped to spritesheet cells.

Achievements give no gameplay rewards. Once a run becomes cheated, the pre-run achievement snapshot is restored, further tracking is blocked, and unlock persistence is not allowed for that run.

Weapon-streak achievements react only when the active weapon actually changes. Merely storing an id in a slot, reselecting the current slot, or interacting with an already-active duplicate does not create a weapon-switch event.

## 19. Hall of Fame and run summary

New run results carry:

- score, kills, and wave;
- credits earned and total credit balance;
- final weapon and unique weapons used;
- active synergies;
- duration and maximum combo;
- end reason (`death` or `aborted` in normal current flows);
- an internal cheated-run marker before record submission.

Saved Hall of Fame entries also contain player name and timestamp. Loading normalizes old entries that lack newer fields, and detail rendering avoids duplicating a one-item weapon list. Cheated runs cannot be submitted to Hall of Fame. Their earnings and lifetime-stat updates are blocked, and achievement progress is rolled back. After death, abort, or return to menu clears the active run cheats, the next normal run is honest again.

The run-results screen provides three actions: `Try Again`, `Upgrades`, and `Main Menu`. `Main Menu` uses the centralized results-to-menu path, clears the pending unsaved result and run-only state, and does not create a Hall of Fame entry automatically.

## 20. Forbidden Protocols — INTERNAL ONLY

This section is for the developer and Codex. Do not copy these codes into public documentation.

Main menu codes:

```text
GODMODE
RICHMAN
TECHPRIEST
ARMORY
SWARMHELL
```

Pause menu codes:

```text
KILLALL
HEALME
TECHNOW
NUKE
```

- Input is assembled from physical `event.code` values, so it is independent of the active keyboard layout.
- There is no visible text field for protocol entry.
- Activation feedback uses a green technical toast.
- Run-affecting menu protocols mark the next run as cheated when that run starts; pause protocols mark the current run immediately.
- A cheated run is excluded from Hall of Fame, lifetime run/kill/best statistics, run earnings, and persistent achievement progress.
- Active run cheats are cleared after death results, abort, or return to the main menu.
- `RICHMAN` is the one non-run credit utility code: it adds 1000 credits and does not set cheated status.

## 21. Rendering and performance

- Fullscreen and windowed changes resize the real canvas and synchronize camera dimensions.
- The camera follows the player inside world bounds; render transforms world coordinates into the current camera view.
- Pointer input is scaled from the canvas client rectangle and then synchronized to world coordinates.
- World-circle visibility checks cull off-camera enemies; terrain rendering uses visible tile bounds.
- Radar, crosshair, banners, boss HP, and active bonus UI use canvas-size-aware placement/scaling.
- Effects should remain readable and should not introduce mass heavy `shadowBlur` work.
- Tech-Priest empowerment uses a cached glow sprite and an arc-render budget. This is a performant but artistically provisional solution.

## 22. Known limitations and technical debt

- No Victory Screen or real victory condition; runs are effectively endless.
- One primary battlefield layout.
- Limited current enemy roster beyond the implemented Sniper role.
- The same three bosses repeat cyclically.
- Elite enemy modifiers are not implemented.
- No fully role-based Wave Director.
- No milestone megaboss every 15 waves.
- Tech-Priest empowerment visuals are provisional.
- Some old internal Russian strings remain in content definitions even though visible UI paths are localized through `i18n.js`.
- `.gitattributes` defines LF normalization for future text changes; the existing tree was not mass-renormalized when the rule was introduced.
- Documentation had drifted before this checkpoint; future changes must update this context and README alongside the implementation.

## 23. Current roadmap

### Stage 0 — Current checkpoint

- targeted impact grenades added before Enemy Evolution work resumes;
- Bastion-7 Field Engineering ability implemented in v0.10.0-alpha;
- documentation audit;
- centralized build version and visible menu label;
- internal release checklist;
- clean-profile regression test;
- Git checkpoint;
- itch.io/GitHub release preparation.

### Stage 1 — Stabilize public alpha

- fix only blocking defects found during verification;
- verify fullscreen behavior;
- verify progression and persistence;
- verify Forbidden Protocol isolation;
- prepare release notes.

### Stage 2 — Enemy Evolution

1. Sniper — implemented in v0.9.0-alpha.
2. Elite enemy modifiers.
3. Role-based Wave Director.
4. Boss behavior expansion.
5. Megaboss milestone waves.

Do not add a separate Summoner to the roadmap. The Tech-Priest of the Swarm already occupies that support/summoner role.

### Stage 3 — Complete run structure

- final victory condition and Victory Screen;
- decide between a finite run and optional endless continuation;
- second map;
- additional weapons and synergies;
- expanded meta progression;
- improved animation and effects.

### Stage 4 — Steam path

- stable demo;
- store assets and trailer;
- possible Coming Soon page;
- decide between Early Access and a full release path.

## 24. Codex workflow

- Work on one concrete patch at a time.
- Inspect actual code before editing; do not treat old documentation as the only source of truth.
- Keep the allowed file set narrow.
- Avoid speculative refactors and unrelated cleanup.
- Run syntax checks for all affected modules and any requested regression set.
- Use the manual release checklist for browser verification.
- End with a concise report of files, checks, manual follow-ups, and real known issues.
- Create a checkpoint after large changes, but never commit or push unless the user explicitly requests it.
