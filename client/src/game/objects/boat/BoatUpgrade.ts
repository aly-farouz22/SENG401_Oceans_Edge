export interface Upgrade {
    name: string;
    description: string;
    cost: number;
    level: number;
    levelMax: number;
    effect: (boat: any) => void;
}
export default class BoatUpgrade {
    private boat: any;
    private upgrades: Upgrade[] = [];
    constructor(boat: any) {
        this.boat = boat;
        this.initializeUpgrades();
    }
    // All upgrades are defined here
    private initializeUpgrades() {
        this.upgrades = [
            {
                name: "Stronger Net",
                description: "Increase Catch Rate by 20%",
                cost: 500,
                level: 0,
                levelMax: 3,
                effect: (boat) => {boat.fishing.catchMultiplier = 1 + 0.2 * boat.upgrades.returnLevel("Stronger Net")}
            },
            {
                name: "Engine Boost",
                description: "Increase Boat Speed by 15%",
                cost: 1000,
                level: 0,
                levelMax: 3,
                effect: (boat) => {boat.movement.catchMultiplier = 1 + 0.15 * boat.upgrades.returnLevel("Engine Boost")}
            },
            {
                name: "Eco Filter",
                description: "Reduce Chance Of Catching Juvenile/Endangered Fish",
                cost: 750,
                level: 0,
                levelMax: 2,
                effect: (boat) => {boat.fishing.ecoFilterLevel = boat.upgrades.returnLevel("Eco Filter")}
            },
        ];
    }
    purchaseUpgrade(name: string) {
        const upgrade = this.upgrades.find(u => u.name === name);
        if (!upgrade) return false;
        if (upgrade.level > upgrade.levelMax) return false;
        if (this.boat.money < upgrade.cost) return false;
        this.boat.money -= upgrade.cost;
        upgrade.level++;
        upgrade.effect(this.boat);
        console.log(`Upgrade Purchased: ${upgrade.name} (Level ${upgrade.level})`);
        return true;
    }
    // This method return the current level of the upgrade
    returnLevel(name: string) {
        const upgrade = this.upgrades.find(u => u.name === name);
        return upgrade ? upgrade.level : 0;
    }
    // This method displays upgrade info in  HUD
    displayUpgrades() {
        return this.upgrades.map( u => ({
            name: u.name,
            description: u.description,
            cost: u.cost,
            level: u.level,
            maxLevel: u.levelMax
        }));
    } 
}