import { FishCatch } from "../objects/FishingZone";
export default class Player {
    name: string;
    money: number = 0;
    fish: FishCatch[] = [];

    constructor(name: string) {
        this.name = name;
    }
    addMoney(amount: number) {
        this.money += amount;
    }
    addFish(fish: FishCatch) {
        this.fish.push(fish);
    }
    clearFish() {
        this.fish = [];
    }
}