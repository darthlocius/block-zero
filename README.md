# Block Zero

Current build: **v0.6.0-alpha**

Block Zero is a browser-based top-down wave-survival shooter set in dark industrial ruins. Fight escalating enemy waves, switch weapons in the field, choose augments between waves, and assemble combat synergies while trying to survive as long as possible.

## Development status

Block Zero is in alpha and active development. The main survival loop is playable, including waves, bosses, build choices, persistent upgrades, achievements, and run records. There is no final victory condition yet, so runs currently end through death or a manual abort.

## Features

- Canvas-rendered top-down combat with a camera larger than the visible viewport
- Windowed play and true fullscreen with real canvas resizing
- English and Russian interface, with English as the default
- Escalating waves, Swarm packs, special support enemies, and cyclic bosses
- Procedural battlefield details, destructible cover, crates, and explosive barrels
- Augment cards with rarity, rerolls, Expanded Selection, and Synergy Scanner
- Five tag-driven combat synergies with guide and progress feedback
- Hunter Drone support and field weapon pickups
- Permanent General/Tactical Protocol and Armory upgrades
- Sixteen achievements, Hall of Fame records, and detailed run summaries
- Pause and death flows, plus hidden old-school Forbidden Protocols
- Eight rotating battle music tracks

## Weapons

The player uses one weapon at a time:

- Pistol
- SMG Viper
- Bulldog-8 Shotgun
- 40 Wt Plasma Rifle

Weapon pickups are not equipped automatically. Move close to one and hold `E` to switch.

## Enemies

- **Hellhound** — fast melee pressure.
- **Orb** — slower ranged attacker with explosive shots.
- **Tank** — strafing ranged pressure.
- **Swarm** — fragile melee creatures that arrive in packs.
- **Tech-Priest of the Swarm** — a shielded support enemy that empowers its allies and emits a damaging signal wave.

Every fourth wave is a boss wave. Three boss templates rotate through the run: Megabrain, Abomination/Biomass, and Warlord/Overlord.

## Meta progression and builds

Runs award credits for permanent upgrades. The current build has 17 upgrades split between general Tactical Protocols and Armory improvements. During a run, 33 possible augments contribute tags toward five synergies: Bullet Storm, Shock Corridor, Crowd Control, Scavenger Loop, and Hunter Swarm.

Achievements are trophies only and do not grant gameplay rewards. Runs that use hidden run-affecting protocols are kept out of honest earnings, achievements, statistics, and Hall of Fame records.

## Controls

- `WASD` or arrow keys — move
- Mouse — aim
- Left mouse button or `Space` — fire
- `Shift` — dash while moving
- Hold `E` near a weapon — equip it
- `Esc` — pause/resume or close the current overlay
- Fullscreen — use the fullscreen button in the UI

Gameplay keys use physical keyboard codes where needed, so movement works with both English and Russian keyboard layouts.

## Running locally

No build step or npm install is required. From the project directory, start a local server:

```bash
python -m http.server 8000
```

or:

```bash
py -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). If updated assets appear stale, use a hard refresh (`Ctrl+F5` or `Ctrl+Shift+R`).

## Saving and reset

Credits, upgrades, achievements, Hall of Fame records, the last player name, and the selected language are stored in browser `localStorage`. Clearing site data resets that progress. See `docs/RELEASE_CHECKLIST.md` for targeted clean-profile commands used during release testing.

## Current limitations

- Alpha development status
- No final victory condition or Victory Screen
- One primary battlefield layout
- Limited enemy roster and three cyclic bosses
- Enemy Evolution work such as Sniper, elite modifiers, and a role-based Wave Director is not implemented yet
- Some Tech-Priest empowerment visuals are provisional

## Roadmap

The current public direction is:

**Sniper → elite modifiers → role-based Wave Director → deeper bosses → victory structure and additional maps**

A possible Steam release is a long-term goal, not a scheduled commitment.

## Project structure

- `index.html` and `style.css` — page structure and interface styling
- `main.js` — bootstrap and game loop orchestration
- `game.js` — shared state, content definitions, progression, achievements, and run lifecycle
- `input.js`, `player.js`, `enemy.js` — controls and actor behavior
- `bullet.js`, `collision.js` — projectiles, hits, destructibles, and explosions
- `render.js` — canvas world and combat UI rendering
- `i18n.js` — English/Russian localization
- `version.js` — current build version
- `assets/` — images, music, and sound effects
- `docs/` — internal project context and release checklist
