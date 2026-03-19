export async function saveGame(userId: string, name: string, data: any) {
    const res = await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, data })
    });
    return res.json();
}

export async function loadGame(userId: string, name: string) {
    const res = await fetch(`/api/game/load/${userId}/${name}`);
    return res.json();
}

export function getCurrentGameState(mainScene: any) {
  return {
    economy: mainScene.economy.getState(),
    ecosystem: mainScene.ecosystem.getState(),
    season: {
      number: mainScene.seasonManager.season,
      name: mainScene.seasonManager.seasonName,
    },
    boat: {
      position: { x: mainScene.boat.x, y: mainScene.boat.y },
      money: mainScene.boat.money,
      fishInventory: mainScene.boat.fish,
      upgrades: mainScene.boat.upgrades.getState(),
    },
    fishingZones: mainScene.fishingZones.map((z: any) => ({
      name: z.name,
      stock: z.getStock(),
      isGone: z.isGone,
    })),
    trashZones: mainScene.trashZones.map((z: any) => ({
      x: z.x,
      y: z.y,
      isGone: z.isGone,
    })),
    marketZones: mainScene.marketZones.map((z: any) => ({
      upgradesAvailable: z.getUpgradesState(),
    })),
  };
}
