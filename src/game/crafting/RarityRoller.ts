import { EquipmentRarity } from "../equipment/EquipmentRarity";
import {
    BASE_CRAFTING_RARITY_WEIGHTS,
    RARITY_LUCK_WEIGHT_FACTORS,
} from "./craftingConfig";

export type RarityWeights = Readonly<Record<EquipmentRarity, number>>;
export type RarityDistribution = Record<EquipmentRarity, number>;

const RARITY_ORDER: ReadonlyArray<EquipmentRarity> = [
    EquipmentRarity.WHITE,
    EquipmentRarity.GREEN,
    EquipmentRarity.BLUE,
    EquipmentRarity.PURPLE,
    EquipmentRarity.GOLD,
    EquipmentRarity.RED,
];

export class RarityRoller {
    private random: () => number;

    constructor(random: () => number = Math.random) {
        this.random = random;
    }

    public roll(
        rarityLuck = 0,
        baseWeights: RarityWeights = BASE_CRAFTING_RARITY_WEIGHTS,
    ): EquipmentRarity {
        const weights = this.getNormalizedWeights(baseWeights, rarityLuck);
        const roll = Math.min(Math.max(this.random(), 0), 0.999999999999) * 100;
        let cumulativeWeight = 0;

        for (const rarity of RARITY_ORDER) {
            cumulativeWeight += weights[rarity];

            if (roll < cumulativeWeight) {
                return rarity;
            }
        }

        return EquipmentRarity.RED;
    }

    public getNormalizedWeights(
        baseWeights: RarityWeights = BASE_CRAFTING_RARITY_WEIGHTS,
        rarityLuck = 0,
    ): Record<EquipmentRarity, number> {
        const safeLuck = Math.max(0, rarityLuck);
        const adjustedEntries = RARITY_ORDER.map((rarity) => {
            const baseWeight = Math.max(0, baseWeights[rarity]);
            const factor = RARITY_LUCK_WEIGHT_FACTORS[rarity];

            return [
                rarity,
                baseWeight * Math.exp(safeLuck * factor),
            ] as const;
        });
        const totalWeight = adjustedEntries.reduce(
            (total, [, weight]) => total + weight,
            0,
        );

        if (totalWeight <= 0) {
            throw new Error("Crafting rarity weights must contain a positive value.");
        }

        return Object.fromEntries(
            adjustedEntries.map(([rarity, weight]) => [
                rarity,
                weight / totalWeight * 100,
            ]),
        ) as Record<EquipmentRarity, number>;
    }

    public getProbabilityDistribution(
        baseWeights: RarityWeights = BASE_CRAFTING_RARITY_WEIGHTS,
        rarityLuck = 0,
    ): RarityDistribution {
        const percentageWeights = this.getNormalizedWeights(
            baseWeights,
            rarityLuck,
        );

        return Object.fromEntries(
            RARITY_ORDER.map((rarity) => [
                rarity,
                percentageWeights[rarity] / 100,
            ]),
        ) as RarityDistribution;
    }

    public simulate(
        rarityLuck: number,
        iterations = 10000,
        baseWeights: RarityWeights = BASE_CRAFTING_RARITY_WEIGHTS,
    ): RarityDistribution {
        const safeIterations = Math.max(1, Math.floor(iterations));
        const counts = Object.fromEntries(
            RARITY_ORDER.map((rarity) => [rarity, 0]),
        ) as Record<EquipmentRarity, number>;

        for (let index = 0; index < safeIterations; index += 1) {
            counts[this.roll(rarityLuck, baseWeights)] += 1;
        }

        return Object.fromEntries(
            RARITY_ORDER.map((rarity) => [
                rarity,
                counts[rarity] / safeIterations,
            ]),
        ) as RarityDistribution;
    }
}
