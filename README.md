# Block Zero

Current build: **v0.11.0-alpha**

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
- Hunter Drone support and run-based dual weapon slots
- Targeted impact grenades with arcing flight, area damage, and a limited three-charge inventory
- Selectable Field Engineering devices: the rapid-fire Bastion-7 Sentry and heavy thermobaric Manticore-4 Grenade Sentry
- Permanent General/Tactical Protocol, Armory, and Field Engineering upgrades
- Sixteen achievements, Hall of Fame records, and detailed run summaries
- Pause and death flows, plus hidden old-school Forbidden Protocols
- Eight rotating battle music tracks

## Weapons

The player fires one active weapon at a time:

- Pistol
- SMG Viper
- Bulldog-8 Shotgun
- 40 Wt Plasma Rifle

The pistol is always available on `1` and does not consume a slot. Two additional weapons can be stored for the current run and selected with `2` and `3`.

Move close to a weapon pickup and hold `E`. A new weapon fills the first empty slot from left to right and becomes active immediately. When both slots are full, a pickup replaces the active stored slot; while the pistol is active, it replaces the last selected stored slot. Duplicate stored weapons are not allowed: a duplicate pickup switches to the existing slot and remains on the ground. Slot contents reset between runs and are not saved in `localStorage`.

## Targeted impact grenades

Press the physical `G` key to throw a grenade toward the world-space cursor. The target is limited to 720 world units and shown by a landing marker while the grenade travels along a visible arc. Its impact damages groups of enemies, respects the Tech-Priest's shield and armor, and can destroy cover or trigger explosive barrels. A run starts with three grenades and restores one charge at the beginning of each wave after the first, up to the maximum of three. The grenade itself does not directly damage the player.

## Field Engineering

`START GAME` opens a pre-run Engineering Loadout popup with Bastion-7 and Manticore-4 choices. The preferred device persists between sessions and is preselected the next time the popup opens. `BEGIN RUN` locks that choice for the complete run; it cannot be switched during combat. Hold the physical `Q` key to position the selected device at the world-space cursor, then release `Q` to deploy it. Right Click or `Esc` cancels placement without starting the cooldown.

### Bastion-7

The Bastion-7 uses separate base and rotating-head sprites, selects the nearest visible enemy, and fires visible projectiles continuously at full auto until its 30-second active phase ends or the wave finishes. It has unlimited ammunition, 10 base damage, and gains 5% damage per wave after wave 4. Its 30-second base cooldown starts only after deactivation. Permanent Field Engineering upgrades improve Bastion damage, fire rate, and redeployment cooldown. Turret bullets stop against cover without damaging it. The sentry has no HP, collision, persistence, or enemy aggro role; player and enemy actors pass through it and enemies continue to target the player.

### Manticore-4

The Manticore-4 is a heavy thermobaric area-damage sentry built for clustered enemies. It cannot fire inside its 190-unit dead zone and reaches targets up to 750 units away with slow visible arcing shells. Each shell commits to the target's current position without predictive lead, making the launcher powerful against groups but unreliable against fast single targets that can escape the saved impact point. Manticore remains active for 30 seconds, begins cooldown only after deactivation, and uses the same Heavy Caliber, Overdrive Motors, and Rapid Redeployment upgrades as Bastion-7.

## Enemies

- **Hellhound** — fast melee pressure.
- **Orb** — slower ranged attacker with explosive shots.
- **Tank** — strafing ranged pressure.
- **Swarm** — fragile melee creatures that arrive in packs.
- **Tech-Priest of the Swarm** — a shielded support enemy that empowers its allies and emits a damaging signal wave. The wave now has a visible and audible telegraph, its damage falls off toward the edge, and the player can escape the marked area before impact.
- **Sniper** — a tougher elite ranged threat with a readable two-stage telegraph and a heavy scarlet hitscan beam. Its aim direction locks before firing, and solid cover blocks the shot.

Every fourth wave is a boss wave. Three boss templates rotate through the run: Megabrain, Abomination/Biomass, and Warlord/Overlord.

## Meta progression and builds

Runs award credits for permanent upgrades. The current build has 20 upgrades split between general Tactical Protocols, Armory improvements, and the three-upgrade Field Engineering branch shared by Bastion-7 and Manticore-4. During a run, 33 possible augments contribute tags toward five synergies: Bullet Storm, Shock Corridor, Crowd Control, Scavenger Loop, and Hunter Swarm.

Achievements are trophies only and do not grant gameplay rewards. Runs that use hidden run-affecting protocols are kept out of honest earnings, achievements, statistics, and Hall of Fame records.

## Controls

- `WASD` or arrow keys — move
- Mouse — aim
- Left mouse button or `Space` — fire
- `Shift` — dash while moving
- `1` — switch to the pistol
- `2` — switch to weapon slot 2
- `3` — switch to weapon slot 3
- Hold `E` near a weapon — store or replace it and equip it
- `G` — throw a targeted impact grenade
- Hold `Q`, move the mouse, and release `Q` — deploy the selected Field Engineering device
- Right Click or `Esc` while positioning — cancel Field Engineering placement
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

Credits and meta progression, achievements, Hall of Fame records, the last player name, the selected language, and the selected Engineering Loadout preference are stored in browser `localStorage`. The run-locked `runDevice`, weapon slots, active turret state, in-flight Manticore shells, and other runtime Field Engineering state are never persisted between runs. Clearing site data resets saved progress. See `docs/RELEASE_CHECKLIST.md` for targeted clean-profile commands used during release testing.

## Current limitations

- Alpha development status
- No final victory condition or Victory Screen
- One primary battlefield layout
- Limited enemy roster and three cyclic bosses
- Enemy Evolution work beyond the Sniper, including elite modifiers and a role-based Wave Director, is not implemented yet
- Some Tech-Priest empowerment visuals are provisional

## Roadmap

The current public direction is:

**Elite modifiers → role-based Wave Director → deeper bosses → victory structure and additional maps**

A possible Steam release is a long-term goal, not a scheduled commitment.

## Project structure

- `index.html` and `style.css` — page structure and interface styling
- `main.js` — bootstrap and game loop orchestration
- `game.js` — shared state, content definitions, progression, achievements, and run lifecycle
- `input.js`, `player.js`, `enemy.js` — controls and actor behavior
- `field-engineering.js` — shared Field Engineering upgrade and scaling formulas
- `engineering-loadout.js` — preferred/run engineering-device state and persistence
- `engineering-device-control.js` — shared Q-device placement routing
- `turret.js` — Bastion-7 configuration, placement, targeting, cooldown, and runtime logic
- `manticore.js` — pure Manticore targeting, balance, placement, and firing logic
- `manticore-shell.js` — ballistic shell flight, detonation, and explosion runtime
- `meta-progression.js` — dependency-free permanent upgrade registry, costs, purchase guards, and save normalization
- `grenade.js` — targeted grenade flight, impact damage, effects, and wave refill
- `bullet.js`, `collision.js` — projectiles, hits, destructibles, and explosions
- `render.js` — canvas world and combat UI rendering
- `i18n.js` — English/Russian localization
- `version.js` — current build version
- `assets/` — images, music, and sound effects
- `docs/` — internal project context and release checklist

## Licensing and asset rights

Block Zero is publicly viewable but is not currently released under an open-source license.

The source code, visual assets, music, documentation, and project identity are not licensed for reuse or redistribution unless explicit permission is granted.

See [ASSET_RIGHTS.md](ASSET_RIGHTS.md) for details.
