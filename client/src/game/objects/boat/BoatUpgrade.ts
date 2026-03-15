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

    private initializeUpgrades() {
        this.upgrades = [
            {
                name: "Stronger Net",
                description: "Increase Catch Rate by 20%",
                cost: 5,
                level: 0,
                levelMax: 3,
                effect: (boat) => {
                    boat._m.fishing.catchMultiplier = 1 + 0.2 * boat._m.upgrades.returnLevel("Stronger Net");
                }
            },
            {
                name: "Engine Boost",
                description: "Increase Boat Speed by 15%",
                cost: 10,
                level: 0,
                levelMax: 3,
                effect: (boat) => {
                    boat._m.movement.speedMultiplier = 1 + 0.15 * boat._m.upgrades.returnLevel("Engine Boost");
                }
            },
            {
                name: "Eco Filter",
                description: "Reduce Chance Of Catching Juvenile/Endangered Fish",
                cost: 15,
                level: 0,
                levelMax: 2,
                effect: (boat) => {
                    boat._m.fishing.ecoFilterLevel = boat._m.upgrades.returnLevel("Eco Filter");
                }
            },
        ];
    }

    purchaseUpgrade(name: string) {
        const upgrade = this.upgrades.find(u => u.name === name);
        if (!upgrade) return false;
        if (upgrade.level >= upgrade.levelMax) return false;

        // Deduct via EconomySystem if available, else fallback
        const economy = this.boat._m?.economy;
        if (economy) {
            if (!economy.canAfford(upgrade.cost)) return false;
            economy.addRevenue(-upgrade.cost); // deduct by adding negative
        } else {
            if (this.boat.money < upgrade.cost) return false;
            this.boat.inventory._money -= upgrade.cost;
        }

        upgrade.level++;
        upgrade.effect(this.boat);
        console.log(`Upgrade Purchased: ${upgrade.name} (Level ${upgrade.level})`);
        return true;
    }

    returnLevel(name: string) {
        const upgrade = this.upgrades.find(u => u.name === name);
        return upgrade ? upgrade.level : 0;
    }

    displayUpgrades() {
        return this.upgrades.map(u => ({
            name:        u.name,
            description: u.description,
            cost:        u.cost,
            level:       u.level,
            maxLevel:    u.levelMax
        }));
    }
}