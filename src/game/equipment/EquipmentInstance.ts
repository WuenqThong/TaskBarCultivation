import type { StatModifier } from "../stats/StatModifier";
import type { EquipmentDefinition } from "./Equipment";
import type { EquipmentRarity } from "./EquipmentRarity";
import type { EquipmentStatRoller } from "./EquipmentStatRoller";
import { INITIAL_STAT_LINE_COUNT } from "./equipmentConfig";

export interface EquipmentInstance {
    instanceId: string;
    definition: EquipmentDefinition;
    rarity: EquipmentRarity;
    rolledStats: StatModifier[];
    unlockedStatLineCount: number;
}

let fallbackInstanceSequence = 0;

export function createEquipmentInstance(
    definition: EquipmentDefinition,
    rarity: EquipmentRarity,
    statRoller: EquipmentStatRoller,
): EquipmentInstance {
    const instanceId = createEquipmentInstanceId();
    const rolledStats = statRoller
        .rollStats(definition, rarity, INITIAL_STAT_LINE_COUNT)
        .map((modifier, index) => ({
            ...modifier,
            id: `equipment-roll:${instanceId}:${index}`,
            source: `equipment:${instanceId}`,
        }));

    return {
        instanceId,
        definition,
        rarity,
        rolledStats,
        unlockedStatLineCount: INITIAL_STAT_LINE_COUNT,
    };
}

function createEquipmentInstanceId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    fallbackInstanceSequence += 1;

    return `equipment-${Date.now()}-${fallbackInstanceSequence}`;
}
