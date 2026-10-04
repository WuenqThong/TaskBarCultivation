import { StatModifierType } from "../stats/StatModifier";
import type { StatModifier } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import type { EquipmentDefinition } from "./Equipment";
import type { EquipmentRarity } from "./EquipmentRarity";
import {
    BASE_STAT_ROLL_RANGES,
    RARITY_STAT_MULTIPLIER,
    REALM_STAT_MULTIPLIER,
    SLOT_STAT_POOLS,
} from "./equipmentConfig";

export class EquipmentStatRoller {
    private random: () => number;

    constructor(random: () => number = Math.random) {
        this.random = random;
    }

    public rollStats(
        definition: EquipmentDefinition,
        rarity: EquipmentRarity,
        lineCount: number,
        excludedStats: ReadonlySet<StatType> = new Set<StatType>(),
    ): StatModifier[] {
        const availableStats = SLOT_STAT_POOLS[definition.slot].filter(
            (stat) => !excludedStats.has(stat),
        );
        const rollCount = Math.min(
            Math.max(Math.floor(lineCount), 0),
            availableStats.length,
        );
        const selectedStats = this.selectUniqueStats(
            availableStats,
            rollCount,
        );

        return selectedStats.map((stat, index) => ({
            id: `roll:${definition.id}:${stat}:${index}`,
            stat,
            type: StatModifierType.FLAT,
            value: this.rollValue(definition, rarity, stat),
            source: `equipment_roll:${definition.id}`,
        }));
    }

    private selectUniqueStats(
        stats: ReadonlyArray<StatType>,
        count: number,
    ): StatType[] {
        const candidates = [...stats];

        for (let index = candidates.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(this.random() * (index + 1));
            const current = candidates[index];

            candidates[index] = candidates[swapIndex];
            candidates[swapIndex] = current;
        }

        return candidates.slice(0, count);
    }

    private rollValue(
        definition: EquipmentDefinition,
        rarity: EquipmentRarity,
        stat: StatType,
    ): number {
        const range = BASE_STAT_ROLL_RANGES[stat];

        if (!range) {
            throw new Error(`Missing equipment roll range for stat: ${stat}`);
        }

        const baseValue = range.min + this.random() * (range.max - range.min);
        const value =
            baseValue *
            RARITY_STAT_MULTIPLIER[rarity] *
            REALM_STAT_MULTIPLIER[definition.requiredRealm];

        return this.roundStatValue(stat, value);
    }

    private roundStatValue(stat: StatType, value: number): number {
        if (
            stat === StatType.ATTACK ||
            stat === StatType.DEFENSE ||
            stat === StatType.MAX_HP
        ) {
            return Math.max(1, Math.round(value));
        }

        if (stat === StatType.HP_REGEN) {
            return Math.round(value * 10) / 10;
        }

        return Math.round(value * 1000) / 1000;
    }
}
