# Block Zero Release Checklist

Use this internal checklist before publishing a build. Record results separately for each candidate archive.

## 1. Static checks

Run from the project root:

```bash
node --check game.js
node --check input.js
node --check player.js
node --check enemy.js
node --check render.js
node --check bullet.js
node --check collision.js
node --check main.js
node --check i18n.js
node --check version.js
```

Also verify that `index.html` contains no duplicate DOM ids and that directly referenced `assets/...` paths exist.

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

- [ ] Only `v0.6.0-alpha` is visible as the build label; it is readable but unobtrusive.
- [ ] Build label does not behave like a button or intercept pointer input.
- [ ] EN is the default on a fully clean origin.
- [ ] EN/RU switching updates all visible menu and overlay text.
- [ ] Audio panel opens, closes, and applies master/music/effects levels.
- [ ] Fullscreen buttons enter/exit true fullscreen and report the correct state.
- [ ] Controls overlay opens and closes.
- [ ] General/Tactical Protocol and Armory upgrade views open and switch tabs.
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

## 7. Cheated run

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

## 8. RICHMAN exception

- [ ] Enter `RICHMAN` from the unobstructed main menu.
- [ ] Exactly 1000 credits are added and persist.
- [ ] No current or next-run cheated status is set.
- [ ] A subsequent honest run awards credits, achievements, statistics, and Hall of Fame eligibility normally.

## 9. Display modes

- [ ] Non-fullscreen layout is usable at the normal viewport size.
- [ ] True fullscreen resizes the real canvas and reveals more world area.
- [ ] 1920×1080 fullscreen is readable.
- [ ] A reduced browser window remains usable without horizontal page scroll.
- [ ] DOM HUD and canvas boss/bonus UI do not overlap critically.
- [ ] Enemies are not hidden behind the HUD without readable radar/threat feedback.
- [ ] Crosshair and shots align with the pointer after resize and fullscreen transitions.
- [ ] Main menu, overlays, and version label do not introduce horizontal scroll.

## 10. Final release gate

- [ ] All syntax checks pass.
- [ ] Manual smoke test passes.
- [ ] Clean-profile test passes.
- [ ] Honest-run test passes.
- [ ] Cheated-run isolation test passes.
- [ ] `RICHMAN` exception test passes.
- [ ] EN/RU test passes.
- [ ] Windowed/fullscreen test passes.
- [ ] Git diff has been reviewed and contains no unintended gameplay or asset changes.
- [ ] A recoverable archive backup exists.
- [ ] `v0.6.0-alpha` is visible in the main menu.
- [ ] `CHANGELOG.md` matches the candidate build.
