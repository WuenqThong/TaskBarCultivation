import type { StatModifier } from "../stats/StatModifier";

export interface ActiveBuff {
    id: string;
    sourceId: string;
    modifiers: StatModifier[];
    remainingDuration: number;
}

export interface BuffModifierInput {
    stat: StatModifier["stat"];
    type: StatModifier["type"];
    value: number;
}
