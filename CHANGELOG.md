# Changelog

## [0.11.0-alpha] — Heavy Ordnance

### Added

- Added the Manticore-4 Grenade Sentry as the second selectable Field Engineering device.
- Added a persistent pre-run Engineering Loadout that lets the player choose between Bastion-7 and Manticore-4 before each run.
- Added a run-locked engineering-device snapshot so the selected sentry cannot be switched during combat.
- Added dedicated Manticore base and rotating-head artwork with four individually cycled launch tubes.
- Added ballistic Manticore shells with visible arcing flight, saved impact coordinates, and no homing or predictive lead.
- Added heavy thermobaric area damage with full-damage and falloff zones, destructible damage, controlled knockback, boss reduction, and normal kill/reward integration.
- Added deterministic cluster-based target selection that prioritizes high-value enemy groups without using random target scoring.
- Added dedicated Manticore launch and explosion sound effects.
- Added a shared Field Engineering Q HUD that displays the active run device and its Ready, Positioning, Active, and Cooldown states.
- Added a CSS-native 2×2 four-tube Manticore icon for both the Engineering Loadout and combat HUD.
- Added dependency-free modules for shared Field Engineering formulas, engineering loadout state, engineering-device routing, Manticore gameplay logic, and Manticore shell runtime.
- Added native regression coverage for Field Engineering sharing, loadout persistence, device routing, Manticore targeting, ballistics, AoE, runtime shells, audio hooks, and lifecycle behavior.

### Manticore-4

- Manticore-4 remains active for 30 seconds and begins its 30-second base cooldown only after deactivation.
- Placement range is 480 world units with a 70-unit player-clearance requirement.
- The launcher has a 190-unit minimum firing range and a 750-unit maximum firing range.
- Base fire interval is 1.45 seconds, with Overdrive Motors increasing fire rate through the shared Field Engineering progression.
- Each firing event launches exactly one grenade and cycles the four tubes in the order 0 → 1 → 2 → 3 → 0.
- The launcher fires at the target's current coordinates without predictive lead; already-fired shells continue toward their saved impact point if the target moves or dies.
- Flight time scales from 0.50 seconds at minimum range to 1.05 seconds at maximum range, with arc height scaling from 120 to 220 world units.
- Base explosion damage is 240.
- Full damage applies within 90 world units.
- Damage falls off to 35% at the 240-unit maximum explosion radius.
- Bosses receive 30% of calculated Manticore explosion damage.
- Destructible battlefield objects receive 68% of calculated explosion damage.
- Base knockback is 360 before distance and target-type modifiers.
- Manticore explosions do not directly damage the player, while secondary barrel explosions retain their normal behavior.
- Shells ignore ordinary cover during flight and explosions are not shielded by cover.
- Manticore has no HP, collision, enemy aggro role, or cover role.
- Head rotation is limited to 4 rad/s and a ready shot waits until the launcher is within 10° of the selected target.
- Manticore damage uses the same +5% per-wave scaling after wave 4 as Bastion-7 before Field Engineering and generic Armory multipliers.

### Field Engineering

- Heavy Caliber, Overdrive Motors, and Rapid Redeployment are now shared by both Bastion-7 and Manticore-4.
- Heavy Caliber provides +6% engineering-device damage per level, up to +30%.
- Overdrive Motors provides +4% engineering-device fire rate per level, up to +20%.
- Rapid Redeployment reduces engineering-device cooldown by 4% per level, down to 24 seconds at level 5.
- Existing `block-zero-meta-v1` progression remains compatible.
- Engineering device preference is stored separately under `block-zero-engineering-loadout-v1`.
- Only `preferredDevice` is persisted; the active run's `runDevice` remains run-only.

### UI / UX

- Moved Engineering Loadout selection out of the permanent main-menu layout into a dedicated pre-run popup opened by `START GAME`.
- Added explicit `BEGIN RUN` confirmation so a run starts only after the engineering device is confirmed.
- Saved engineering-device preference is automatically preselected when the popup opens.
- Added keyboard-focus, `aria-pressed`, `inert`, `aria-hidden`, Esc cancellation, and backdrop-close behavior to the pre-run loadout flow.
- Redesigned the main menu around the central soldier artwork instead of covering it with a rectangular control grid.
- `START GAME` now anchors the composition above the central soldier and `EXIT` below it.
- Remaining menu controls form mirrored left/right arcs on desktop while narrow screens fall back to a readable vertical layout.
- Improved visibility of the game logo and central background artwork.
- Redesigned the Manticore HUD/loadout icon from parallel bars into a readable four-tube 2×2 launcher face.
- Reflowed the narrow combat utility HUD into a viewport-centered two-row grid so Field Engineering, grenades, and both weapon slots remain fully visible without changing the 760px combat geometry.

### Audio

- Added `manticore-launch.mp3`, played exactly once when a real Manticore shell is spawned.
- Added `manticore-explosion.mp3`, played exactly once at actual shell detonation.
- Manticore launch and explosion SFX use runtime gain `0.5616` and playback rate `1.0`.
- Manticore one-shot effects use polyphonic playback so explosion tails are not cut off by subsequent launch sounds.
- Manticore detonation does not layer the generic grenade explosion sound over its dedicated explosion sample.
- Increased Bastion-7's sustained machine-gun runtime gain by 30%, from `0.432` to `0.5616`.
- Bastion-7's base playback rate remains `0.94` and continues to track Overdrive Motors fire-rate scaling.
- Bastion and Manticore audio continue to obey the existing master and SFX volume controls.

### Changed

- Engineering-device input now routes through a shared device-control layer while preserving physical `KeyQ` hold/release placement.
- The shared Q HUD dynamically represents Bastion-7 or Manticore-4 according to the run-locked engineering loadout.
- Main-menu layout is now responsive around the background composition rather than a single central button matrix.

### Technical / Maintenance

- Extracted shared Field Engineering formulas into a dependency-free module while preserving Bastion-7's existing external behavior.
- Added an isolated engineering-loadout state module with safe persistence and backwards-safe defaults.
- Added a small engineering-device routing layer so Q input remains independent of individual sentry implementations.
- Kept Manticore gameplay and shell modules free from DOM/audio dependencies.
- Integrated Manticore damage through the existing enemy damage, shield, armor, knockback, destructible, score, credit, combo, achievement, pickup, and cleanup paths.
- Manticore kills do not create a weapon id, do not add to `weaponsUsed`, and do not falsely activate weapon-specific synergies.
- Expanded the dependency-free regression suite to 197 tests before the final release pass.

## [0.10.0-alpha] — Field Engineering

### Field Engineering

### Added

- Added the Bastion-7 Sentry as a run-only active Field Engineering ability.
- Added physical `KeyQ` hold-to-position and release-to-deploy controls, with Right Click and `Esc` cancellation.
- Added separate stationary-base and rotating-head sprite rendering with explicit pivot and muzzle metadata.
- Added automated cover-aware nearest-target acquisition and visible-projectile automatic fire.
- Added a CSS-native Bastion-7 HUD card to the left of the grenade and weapon-slot cards.
- Added complete English/Russian controls, status labels, and accessibility text.
- Added dependency-free native regression coverage for turret configuration, placement, cooldown, lifetime, spread, targeting, full-auto behavior, and damage scaling.
- Added the Field Engineering permanent meta-upgrade branch to the existing progression screen.
- Added Heavy Caliber for Bastion-7 damage progression.
- Added Overdrive Motors for Bastion-7 fire-rate progression.
- Added Rapid Redeployment for Bastion-7 cooldown progression.

### Audio

- Bastion-7 now uses a dedicated sustained machine-gun firing loop.
- Increased the dedicated Bastion-7 machine-gun loop runtime gain and synchronized playback rate with Overdrive Motors.

### Visuals

- Bastion-7 projectiles now use kinetic tracer visuals instead of green energy-like bolts.

### Balance

- Bastion-7 active duration increased from 14 to 30 seconds.
- Bastion-7 now uses continuous full-auto fire at 0.10-second intervals instead of seven-round bursts.
- Removed the Bastion-7 ammunition limit.
- Bastion-7's 30-second cooldown now begins after the sentry deactivates rather than on deployment.
- Its 600-unit attack range uses distance-scaled spread from ±7° to ±11°.
- Base projectile damage increased from 7 to 10.
- Bastion-7 damage now scales by 5% per wave after wave 4, before Field Engineering and the generic permanent Armory damage multiplier.
- Bosses continue to receive 60% of calculated turret damage.

## [0.9.0-alpha] — In Development

### Added

- Added the Sniper, a long-range ordinary enemy that begins appearing from wave 5.
- Added a localized one-time detection banner for the first Sniper spawned in each run.
- Added a distinct Sniper marker to the motion tracker.

### Fixed

- Weapon names now respect the active EN/RU localization in the HUD and weapon pickup banners.
- `localStorage` writes now fail gracefully when browser storage is unavailable.

### Maintenance

- Added `.gitattributes` to normalize text line endings for future changes without renormalizing the current tree.
- Added a small dependency-free storage helper module for safe persistence reads, writes, and removals.
- Added native Node.js regression tests for storage safety, collision geometry, and Sniper wave planning.

### Enemy AI

- Added dedicated wave-slot planning with early/mid/late spawn chances and a maximum of two active Snipers from wave 12 onward.
- Added long-range positioning, edge avoidance, cover-aware line of sight, and a reposition phase after every shot.
- Added a 1.35-second tracking/lock warning; the final 0.32 seconds fix the firing direction so movement, dash, or cover can avoid the shot.
- Tech-Priest empowerment can strengthen Sniper health, damage, movement, and recovery without shortening its mandatory warning phases.

### Visuals

- Added layered tracking and pulsing final-lock lines with a clearer visual step between warning phases.
- Added a short, heavy scarlet `#ff2400` hitscan beam with a bright hot center and controlled muzzle, impact, and screen-shake effects.
- Solid destructible cover stops both the warning line and the fired beam.

### Audio

- Added synthesized aim-start, target-lock, and energy-crack cues through the existing Web Audio system.

### Balance

- Increased Sniper base health from 112 HP to 180 HP so the ranged threat survives long enough to complete its intended pressure cycle.
- Sniper base stats: 180 HP, 34 damage, 86 speed, 27 radius, 42 reward, and 4.4-second base attack cooldown.
- Waves 5–7 have a 40% chance for one Sniper unless a Tech-Priest is planned; waves 8–11 have a 65% chance for one; waves 12+ guarantee one with a 35% chance for a second.
- Snipers use normal wave HP/damage scaling, have no contact attack, and retain ordinary reward, combo, pickup, and kill-stat paths.

## [0.8.0-alpha] — In Development

### Added

- Dual run-based weapon slots on keys 2 and 3, displayed next to the grenade HUD.
- Instant switching between pistol (1) and stored weapons (2 / 3).
- Automatic storage and activation of newly picked up weapons.
- CSS-based weapon slot pictograms for SMG, shotgun, and plasma loadouts.

### Changed

- Weapon pickups now fill the first free slot from left to right.
- When both slots are full, newly picked up weapons replace the active slot.
- If the pistol is active, a new pickup replaces the last selected weapon slot.
- Duplicate stored weapons are no longer allowed; interacting with a duplicate pickup switches to the existing slot instead.

### UI

- Added a centered Main Menu button to the run-results screen.

## [0.7.1-alpha] — In Development

### Changed

- Reworked the Tech-Priest signal wave into a telegraphed attack.
- Reduced signal-wave radius from 620 to 500.
- Added distance-based damage falloff while preserving full close-range damage.
- Delayed the first signal wave and increased the interval between repeated impacts.
- The Tech-Priest stops firing and moves more slowly while charging the signal wave.
- Signal-wave damage is now evaluated only when the charge completes.

### Audio

- Added a distinct synthesized warning sound for signal-wave charging.
- Added a separate synthesized impact sound for the released wave.

### Visuals

- Added a visible ground-zone warning and inward energy-convergence effect.
- The expanding impact ring now represents the actual completed attack rather than damage that already happened without warning.

## [0.7.0-alpha] — In Development

### Added

- Targeted impact grenades thrown toward the world-space cursor with the G key.
- Visible arcing flight, landing marker, impact explosion, and expanding shockwave.
- Three-charge grenade inventory with one charge restored at the start of each wave after the first.
- Bottom-left grenade counter integrated into the gameplay HUD.
- Grenade damage against enemies, Tech-Priest shields, and destructible battlefield objects.

### Balance

- Three maximum grenade charges.
- 460 center damage with distance falloff across a 230-unit radius.
- Reduced grenade damage against bosses.
- Grenades do not directly damage the player.

## [0.6.0-alpha] — Current Development Checkpoint

### Added

- Tech-Priest of the Swarm as a shielded support enemy.
- Eligible-wave chance and pity-spawn handling for the Tech-Priest.
- Tech-Priest empowerment for ordinary enemies, including stronger melee pressure.
- A damaging Tech-Priest signal wave and guaranteed special loot on defeat.
- Hidden Forbidden Protocols for main-menu and paused-run testing.
- Green protocol activation toast feedback.
- Cheated-run protection for achievements, run statistics, earnings, and Hall of Fame records.
- General/Tactical Protocol and Armory meta-upgrades, with 17 permanent upgrades in the current registry.
- Sixteen persistent achievements with progress tracking and queued unlock toasts.
- Hall of Fame run details and end-of-run summaries.
- Thirty-three rarity- and tag-based wave augments, rerolls, Expanded Selection, and Synergy Scanner.
- Five combat synergies with guide, progress hints, activation feedback, and an active-synergy panel.
- Hunter Drone support, Swarm packs, destructible cover, and explosive barrels.
- Eight-track rotating battle playlist.

### Changed

- Empowered melee enemies are faster and attack more aggressively.
- Tech-Priest balance was strengthened to the current accepted checkpoint.
- Fullscreen, UI, progression, achievement, and Hall of Fame systems reached the current alpha checkpoint.
- Documentation was audited against the implementation.
- Build metadata is centralized in `version.js` and shown in the main menu.

### Progression integrity

- Cheated runs are unranked and cannot be saved to Hall of Fame.
- Achievement progress from a run is blocked and rolled back when the run becomes cheated.
- Cheated runs do not award run credits or update honest lifetime run statistics.
- Active run cheats are cleared after run termination or return to the main menu.
- One non-run credit utility code remains intentionally exempt from cheated-run status; the public code is not disclosed here.

### Known limitations

- No final victory condition or Victory Screen.
- One primary battlefield layout.
- Tech-Priest empowerment visuals are provisional.
- Enemy Evolution is incomplete: Sniper, elite modifiers, a role-based Wave Director, deeper boss behavior, and milestone megaboss waves remain future work.
