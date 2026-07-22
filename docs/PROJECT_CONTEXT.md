# Block Zero — Project Context

## 1. Project identity

Block Zero is a browser-based top-down wave-survival shooter built with HTML, CSS, and vanilla JavaScript. Its visual direction is dark science fiction set among industrial ruins: the battlefield stays muted while enemies, pickups, projectiles, effects, and UI use brighter accents for readability.

This is the author's first serious game project. A future Steam release is a possible long-term direction, not a confirmed release commitment.

## 2. Current build

```text
Current version: 0.6.0-alpha
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

## 4. File map

- `version.js` — single source for the public build version and label.
- `main.js` — bootstrap, animation loop, and high-level update ordering.
- `game.js` — shared DOM references, game and run state, content definitions, assets/audio, bonuses, synergies, achievements, meta progression, Hall of Fame, menus, run lifecycle, and common helpers.
- `input.js` — keyboard and pointer input, fullscreen control, menu wiring, audio controls, and internal Forbidden Protocol entry handling.
- `player.js` — player movement, firing trigger, ordinary pickup collection, and hold-to-equip weapon handling.
- `enemy.js` — wave creation, spawning, enemy and boss behavior, Swarm packs, Tech-Priest support logic, and wave completion.
- `render.js` — canvas rendering for the map, actors, effects, pickups, radar, crosshair, banners, and boss UI.
- `bullet.js` — player/enemy projectiles, weapon fire, dash, hit processing, and projectile-driven synergy effects.
- `collision.js` — actor/solid collision, destructible damage, projectile obstruction, and barrel explosion damage.
- `i18n.js` — EN/RU strings, language persistence, translation helpers, and static DOM translation.
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
- Maintain complete EN/RU UI coverage and keep EN as the default language.
- Keep DOM ids unique.
- Fullscreen is controlled through UI buttons, never the `F` key.
- Do not change the weapon pickup radius or hold duration unless specifically requested.
- Do not change gameplay balance during UI or documentation work.
- Achievements are trophies and must not grant credits, stats, or combat rewards.
- Cheated runs must not enter honest statistics, earnings, achievements, or Hall of Fame records.
- Avoid speculative refactors and unrelated asset, sound, or music changes.

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

## 7. Controls and input

Gameplay controls use physical `event.code` mappings where layout independence matters, so movement and internal code entry work under both EN and RU keyboard layouts.

- `W`, `A`, `S`, `D` (`KeyW`, `KeyA`, `KeyS`, `KeyD`) or arrow keys — move.
- Mouse — aim.
- Left mouse button or `Space` — fire.
- Left or right `Shift` — dash in the current movement direction; dash requires movement input and has a cooldown.
- Hold `E` (`KeyE`) near a weapon pickup — equip it. The current hold duration is 0.35 seconds and the interaction radius is 56 world units.
- `Esc` — pause/resume an active run, close the topmost menu overlay, return from results, or confirm the finished death sequence where applicable.
- Fullscreen — UI buttons only.

The pointer is converted from CSS pixels into real canvas coordinates, then into camera-relative world coordinates. Preserve this path when changing layout or fullscreen code.

## 8. Current stable systems

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
- Hunter Drone support;
- destructible cover, crates, and explosive barrels;
- eight rotating battle music tracks.

## 9. Weapons

There are four active weapon definitions:

- `pistol` — Pistol;
- `smg` — SMG Viper / `SMG "Гадюка"`;
- `shotgun` — Bulldog-8 Shotgun / `Бульдог-8`;
- `rail` — 40 Wt Plasma Rifle / `Плазменная винтовка 40 Wt` (the Coil Lance family is still reflected in asset/audio filenames).

The player has one active weapon at a time; there are no weapon slots. Weapon pickups are not auto-equipped and require holding `E`. The internal `ARMORY` protocol creates nearby pickups for the three non-default weapons; it does not grant multiple simultaneously active weapons.

## 10. Enemies

- **Hellhound** (`animal`) — fast melee pursuer that closes on the player and attacks at contact range.
- **Orb** (`monster`) — slower ranged enemy that tries to keep distance and fires explosive projectiles.
- **Tank** (`criminal`) — ranged pressure unit that strafes and fires cannon-like shots.
- **Swarm** (`swarm`) — fragile, fast melee creature deployed in packs; packs begin appearing from wave 2.
- **Tech-Priest of the Swarm** (`techpriest`) — special support enemy that empowers ordinary allies while it lives.

### Tech-Priest behavior and balance

- Eligible from wave 5 and absent from boss waves.
- At most one Tech-Priest is planned/spawned in a wave.
- Natural chance is 30% before wave 8 and 50% from wave 8 onward.
- Pity logic forces a spawn after three missed eligible waves.
- Spawns partway through the regular wave roster and immediately empowers eligible living allies; later spawns are empowered while the support effect remains active.
- Empowerment increases HP, damage, ranged attack pressure, and melee pressure.
- Uses a shield equal to 115% of its scaled HP and then 30% armor damage reduction after the shield breaks.
- Fires five-shot blaster bursts and periodically emits a signal wave that damages the player within its radius.
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

Signal-wave parameters:

```text
Radius: 620
Base damage: 18
Damage per wave: 0.8
```

## 11. Bosses

Boss waves occur every fourth wave. The following three templates rotate cyclically:

- `alpha` — Megabrain / Мегамозг;
- `abomination` — Abomination / Отродье template, currently displayed as Biomass / Биомасса;
- `warlord` — Warlord / Повелитель битвы template, currently displayed as Overlord / Оверлорд.

Boss waves display a warning, an HP bar, and a defeated banner. They do not allow a Tech-Priest. Current bosses have distinct attacks and summoning behavior, but their behavior depth is still intended to expand in a later Enemy Evolution stage.

## 12. Wave progression

- Runs start with an intermission, then advance through numbered survival waves.
- Enemy totals, spawn cadence, HP, damage, and some movement scale with wave number.
- Hellhound is present first; Tank enters the pool at wave 2 and Orb at wave 3.
- Swarm packs begin at wave 2 and their target count rises through later wave bands.
- Every fourth wave includes one of the three cyclic bosses.
- Eligible non-boss waves can contain a Tech-Priest, including pity-spawn handling.
- Clearing a wave starts a short clear sequence followed by augment selection and the next intermission.
- There is no final victory and no fully role-based Wave Director yet.

## 13. Wave bonuses

The current `waveBonuses` registry contains **33** `createWaveBonus(...)` entries. Bonuses have rarity, weighting, tags, localized title/description data, and availability conditions where relevant. The system supports:

- common, rare, epic, and legendary rarity;
- rerolls from the permanent Reroll Protocol;
- three choices by default or four with Expanded Selection;
- build tags and Synergy Scanner hints;
- temporary next-wave modifiers and persistent run modifiers;
- weapon-specific and general combat/utility bonuses.

Do not duplicate all bonus definitions in documentation; `game.js` remains the source of truth for their exact effects.

## 14. Synergies

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

## 15. Meta progression

There are **17** permanent `metaUpgrades`: 11 in the General/Tactical Protocols group and 6 in Armory. They cover core stats, pickup and perk behavior, reroll/selection/scanner utilities, and weapon-wide Armory modifiers.

Meta progression uses credits, upgrade levels/costs, lifetime run statistics, and `block-zero-meta-v1` persistence. Never reset credits, levels, or saved statistics without an explicit request. Preserve all existing costs and effects unless a dedicated balance task says otherwise.

## 16. Achievements

The game has **16** achievements. They are stored separately under `block-zero-achievements-v1` and use:

- persistent counters for kills, Swarm kills, and destroyed barrels;
- per-run wave, weapon-streak, Swarm, barrel, synergy, boss, and no-damage checks;
- a queued toast system;
- a 4×4 spritesheet at `assets/images/ui/achievement_icons_sheet.png`;
- `iconIndex` values 0–15 mapped to spritesheet cells.

Achievements give no gameplay rewards. Once a run becomes cheated, the pre-run achievement snapshot is restored, further tracking is blocked, and unlock persistence is not allowed for that run.

## 17. Hall of Fame and run summary

New run results carry:

- score, kills, and wave;
- credits earned and total credit balance;
- final weapon and unique weapons used;
- active synergies;
- duration and maximum combo;
- end reason (`death` or `aborted` in normal current flows);
- an internal cheated-run marker before record submission.

Saved Hall of Fame entries also contain player name and timestamp. Loading normalizes old entries that lack newer fields, and detail rendering avoids duplicating a one-item weapon list. Cheated runs cannot be submitted to Hall of Fame. Their earnings and lifetime-stat updates are blocked, and achievement progress is rolled back. After death, abort, or return to menu clears the active run cheats, the next normal run is honest again.

## 18. Forbidden Protocols — INTERNAL ONLY

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

## 19. Rendering and performance

- Fullscreen and windowed changes resize the real canvas and synchronize camera dimensions.
- The camera follows the player inside world bounds; render transforms world coordinates into the current camera view.
- Pointer input is scaled from the canvas client rectangle and then synchronized to world coordinates.
- World-circle visibility checks cull off-camera enemies; terrain rendering uses visible tile bounds.
- Radar, crosshair, banners, boss HP, and active bonus UI use canvas-size-aware placement/scaling.
- Effects should remain readable and should not introduce mass heavy `shadowBlur` work.
- Tech-Priest empowerment uses a cached glow sprite and an arc-render budget. This is a performant but artistically provisional solution.

## 20. Known limitations and technical debt

- No Victory Screen or real victory condition; runs are effectively endless.
- One primary battlefield layout.
- Limited current enemy roster.
- The same three bosses repeat cyclically.
- Sniper is not implemented.
- Elite enemy modifiers are not implemented.
- No fully role-based Wave Director.
- No milestone megaboss every 15 waves.
- Tech-Priest empowerment visuals are provisional.
- Some old internal Russian strings remain in content definitions even though visible UI paths are localized through `i18n.js`.
- Documentation had drifted before this checkpoint; future changes must update this context and README alongside the implementation.

## 21. Current roadmap

### Stage 0 — Current checkpoint

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

1. Sniper.
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

## 22. Codex workflow

- Work on one concrete patch at a time.
- Inspect actual code before editing; do not treat old documentation as the only source of truth.
- Keep the allowed file set narrow.
- Avoid speculative refactors and unrelated cleanup.
- Run syntax checks for all affected modules and any requested regression set.
- Use the manual release checklist for browser verification.
- End with a concise report of files, checks, manual follow-ups, and real known issues.
- Create a checkpoint after large changes, but never commit or push unless the user explicitly requests it.
