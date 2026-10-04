import type { StatType } from "./StatType";

export enum StatModifierType {
    FLAT = "flat",
    PERCENT = "percent",
}

export interface StatModifier {
    id: string;
    stat: StatType;
    type: StatModifierType;
    value: number;
    source?: string;
}
