# Changelog

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
