import type { StatModifier } from "../stats/StatModifier";

export interface TechniqueMilestone {
    requiredLevel: number;
    modifiers: StatModifier[];
    description?: string;
}

export interface TechniqueDefinition {
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    milestones: TechniqueMilestone[];
}
