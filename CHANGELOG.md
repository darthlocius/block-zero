# Changelog

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
