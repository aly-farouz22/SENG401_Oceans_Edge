// client/src/utils/saveGame.ts
import { EconomySystem } from "../game/systems/EconomySystem";
import { EcosystemSystem } from "../game/systems/EcosystemSystem";
import SeasonManager from "../game/objects/SeasonManager";
import Boat from "../game/objects/boat/Boat";

export function getGameState(economy: EconomySystem, ecosystem: EcosystemSystem, seasonManager: SeasonManager, boat: Boat) {
    return {
        economy: economy.getState(),
        ecosystem: ecosystem.getState(),
        season: {
            number: seasonManager.season,
            name: seasonManager.seasonName
        },
        boat: {
            fish: boat.fish,
            money: boat.money,
            upgrades: boat.upgrades.map(u => u.name)
        }
    };
}