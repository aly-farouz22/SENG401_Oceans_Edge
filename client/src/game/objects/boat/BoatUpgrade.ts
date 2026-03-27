export interface Upgrade {
    name: string;
    description: string;
    cost: number;
    level: number;
    levelMax: number;
    effect: (boat: any) => void;
}

const UPGRADE_SCALE: Record<string, number> = {
  "Stronger Net": 25,
  "Engine Boost": 15,
  "Eco Filter":   30,
  "Larger Hold":  50,
};

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
                cost: 50,
                level: 0,
                levelMax: 3,
                effect: (boat) => {
                    boat._m.fishing.catchMultiplier = 1 + 0.2 * boat._m.upgrades.returnLevel("Stronger Net");
                }
            },
            {
                name: "Engine Boost",
                description: "Increase Boat Speed by 15%",
                cost: 30,
                level: 0,
                levelMax: 3,
                effect: (boat) => {
                    boat._m.movement.speedMultiplier = 1 + 0.15 * boat._m.upgrades.returnLevel("Engine Boost");
                }
            },
            {
                name: "Eco Filter",
                description: "Reduce Chance Of Catching Juvenile/Endangered Fish",
                cost: 70,
                level: 0,
                levelMax: 2,
                effect: (boat) => {
                    boat._m.fishing.ecoFilterLevel = boat._m.upgrades.returnLevel("Eco Filter");
                }
            },
            {
                name: "Larger Hold",
                description: "Expand inventory capacity by 5 slots",
                cost: 50,
                level: 0,
                levelMax: 4,
                effect: (boat) => {
                    // Capacity is read dynamically via returnLevel so no action needed here
                }
            },
        ];
    }

    purchaseUpgrade(name: string) {
        const upgrade = this.upgrades.find(u => u.name === name);
        if (!upgrade) return false;
        if (upgrade.level >= upgrade.levelMax) return false;

        const cost = upgrade.cost + upgrade.level * (UPGRADE_SCALE[upgrade.name] ?? 0);

        const economy = this.boat._m?.economy;
        if (economy) {
            if (!economy.canAfford(cost)) return false;
            economy.getState().balance -= cost;
            economy.getState().totalExpenses += cost;
        } else {
            if (this.boat.money < cost) return false;
            this.boat.inventory._money -= cost;
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

    getInventoryCapacity(): number {
        return 10 + this.returnLevel("Larger Hold") * 5;
    }

    displayUpgrades() {
        return this.upgrades.map(u => ({
            name:        u.name,
            description: u.description,
            cost:        u.cost + u.level * (UPGRADE_SCALE[u.name] ?? 0),
            level:       u.level,
            maxLevel:    u.levelMax,
        }));
    }

    getLevels(): Record<string, number> {
        const levels: Record<string, number> = {};
        this.upgrades.forEach(u => { levels[u.name] = u.level; });
        return levels;
    }

    restoreLevels(levels: Record<string, number>) {
        this.upgrades.forEach(u => {
            if (levels[u.name] !== undefined) {
                u.level = levels[u.name];
                if (u.level > 0) u.effect(this.boat);
            }
        });
    }
}