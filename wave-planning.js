// Pure wave-planning helpers that can run without the browser game bootstrap.

const SNIPER_SPAWN = Object.freeze({
  firstWave: 5,
  earlyChance: 0.4,
  midChance: 0.65,
  secondLateChance: 0.35,
  firstSpawnMin: 0.22,
  firstSpawnMax: 0.42,
  secondSpawnMin: 0.62,
  secondSpawnMax: 0.82,
});

function randomBetween(random, min, max) {
  return min + (max - min) * random();
}

function planSnipersForWave(
  wave,
  bossWave,
  regularTotal,
  techpriestPlanned,
  random = Math.random,
) {
  let sniperPlannedCount = 0;

  if (!bossWave && wave >= SNIPER_SPAWN.firstWave) {
    if (wave <= 7) {
      if (!techpriestPlanned && random() < SNIPER_SPAWN.earlyChance) {
        sniperPlannedCount = 1;
      }
    } else if (wave <= 11) {
      if (random() < SNIPER_SPAWN.midChance) sniperPlannedCount = 1;
    } else {
      sniperPlannedCount = 1 + (random() < SNIPER_SPAWN.secondLateChance ? 1 : 0);
    }
  }

  const sniperSpawnIndices = [];
  const lastSlot = Math.max(0, regularTotal - 1);

  if (sniperPlannedCount > 0 && regularTotal > 0) {
    const firstIndex = Math.min(
      lastSlot,
      Math.max(
        0,
        Math.floor(
          regularTotal
          * randomBetween(random, SNIPER_SPAWN.firstSpawnMin, SNIPER_SPAWN.firstSpawnMax),
        ),
      ),
    );
    sniperSpawnIndices.push(firstIndex);
  }

  if (sniperPlannedCount > 1 && regularTotal > 1) {
    const secondIndex = Math.min(
      lastSlot,
      Math.max(
        sniperSpawnIndices[0] + 1,
        Math.floor(
          regularTotal
          * randomBetween(random, SNIPER_SPAWN.secondSpawnMin, SNIPER_SPAWN.secondSpawnMax),
        ),
      ),
    );
    sniperSpawnIndices.push(secondIndex);
  }

  return {
    sniperPlannedCount: sniperSpawnIndices.length,
    sniperSpawnIndices,
    sniperSpawnPoints: [],
    snipersSpawned: 0,
    maxActiveSnipers: sniperSpawnIndices.length === 0 ? 0 : (wave >= 12 ? 2 : 1),
  };
}

export {
  SNIPER_SPAWN,
  planSnipersForWave,
};
