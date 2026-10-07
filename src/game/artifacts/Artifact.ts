import type { StatModifier } from "../stats/StatModifier";
import type { ArtifactRarity } from "./ArtifactRarity";

export interface ArtifactDefinition {
    id: string;
    name: string;
    description: string;
    rarity: ArtifactRarity;
    unlockChapter: number;
    baseModifiers: StatModifier[];
}
