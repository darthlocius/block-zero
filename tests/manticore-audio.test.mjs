import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gameSource = readFileSync(new URL("../game.js", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../main.js", import.meta.url), "utf8");
const manticoreSource = readFileSync(new URL("../manticore.js", import.meta.url), "utf8");
const shellSource = readFileSync(new URL("../manticore-shell.js", import.meta.url), "utf8");

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test("Bastion and both Manticore samples share exact runtime gain 0.5616", () => {
  const configSource = sourceSection(
    gameSource,
    "const FIELD_ENGINEERING_AUDIO_GAIN",
    "const playerSpritesheetMeta",
  );

  assert.match(configSource, /const FIELD_ENGINEERING_AUDIO_GAIN = 0\.5616;/);
  assert.equal(
    (configSource.match(/gain:\s*FIELD_ENGINEERING_AUDIO_GAIN/g) || []).length,
    3,
  );
  assert.match(configSource, /basePlaybackRate:\s*TURRET_AUDIO_CONFIG\.baseLoopPlaybackRate/);
  assert.equal((configSource.match(/playbackRate:\s*1,/g) || []).length, 2);
});

test("Manticore launch and explosion assets are registered", () => {
  assert.match(
    gameSource,
    /manticore_launch:\s*"assets\/audio\/manticore-launch\.mp3"/,
  );
  assert.match(
    gameSource,
    /manticore_explosion:\s*"assets\/audio\/manticore-explosion\.mp3"/,
  );
});

test("Manticore one-shots apply local gain and playback rate before user volumes", () => {
  const launchMethod = sourceSection(
    gameSource,
    "manticoreLaunch()",
    "manticoreExplosion()",
  );
  const explosionMethod = sourceSection(
    gameSource,
    "manticoreExplosion()",
    "dash()",
  );

  for (const [method, kind] of [
    [launchMethod, "launch"],
    [explosionMethod, "explosion"],
  ]) {
    assert.match(method, /this\.playAssetSfx\(/);
    assert.match(method, /this\.volumes\.master \* this\.volumes\.sfx/);
    assert.match(method, new RegExp(`MANTICORE_AUDIO_CONFIG\\.${kind}\\.gain`));
    assert.match(method, new RegExp(`playbackRate: MANTICORE_AUDIO_CONFIG\\.${kind}\\.playbackRate`));
    assert.doesNotMatch(method, /playbackRateRange|minInterval/);
  }
});

test("Manticore launch audio occurs once only after successful shell spawn", () => {
  const spawnIntegration = sourceSection(
    mainSource,
    "function spawnManticore4Shot",
    "manticoreContext.onShot",
  );
  const shellSpawn = spawnIntegration.indexOf("const shell = spawnManticoreShell");
  const spawnGuard = spawnIntegration.indexOf("if (!shell) return null;");
  const launchAudio = spawnIntegration.indexOf("audio.manticoreLaunch();");

  assert.ok(shellSpawn >= 0);
  assert.ok(spawnGuard > shellSpawn);
  assert.ok(launchAudio > spawnGuard);
  assert.equal((mainSource.match(/audio\.manticoreLaunch\(\)/g) || []).length, 1);
  assert.doesNotMatch(
    sourceSection(mainSource, "function updateManticore4", "function updateEngineeringDevice"),
    /manticoreLaunch/,
  );
});

test("Manticore detonation uses one dedicated explosion callback without generic SFX", () => {
  const callbacks = sourceSection(
    mainSource,
    "const manticoreShellCallbacks",
    "function updateManticoreShellRuntime",
  );

  assert.match(callbacks, /onDetonate:\s*\(\) => audio\.manticoreExplosion\(\)/);
  assert.equal((mainSource.match(/audio\.manticoreExplosion\(\)/g) || []).length, 1);
  assert.doesNotMatch(callbacks, /audio\.explosion\(/);
});

test("Manticore audio leaves pure gameplay and shell descriptors dependency-free", () => {
  for (const source of [manticoreSource, shellSource]) {
    assert.doesNotMatch(source, /manticore-(?:launch|explosion)\.mp3/);
    assert.doesNotMatch(source, /audio\.manticore(?:Launch|Explosion)/);
  }
});

test("asset one-shots clone nodes so overlapping launch and explosion tails survive", () => {
  const playAudio = sourceSection(gameSource, "playAudio(key", "playMusic(key");

  assert.match(playAudio, /const node = source\.cloneNode\(\);/);
  assert.match(playAudio, /node\.loop = loop;/);
  assert.doesNotMatch(playAudio, /currentTime\s*=\s*0/);
});
