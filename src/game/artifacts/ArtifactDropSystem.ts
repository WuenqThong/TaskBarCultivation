import type { ArtifactDefinition } from "./Artifact";
import {
    getArtifactFragmentDropBand,
} from "./artifactConfig";

export interface ArtifactFragmentDrop {
    artifactId: string;
    amount: number;
}

export class ArtifactDropSystem {
    private definitions: ReadonlyArray<ArtifactDefinition>;
    private random: () => number;

    constructor(
        definitions: ReadonlyArray<ArtifactDefinition>,
        random: () => number = Math.random,
    ) {
        this.definitions = definitions;
        this.random = random;
    }

    public rollDrop(
        chapter: number,
        stage: number,
        isBoss: boolean,
    ): ArtifactFragmentDrop | null {
        const band = getArtifactFragmentDropBand(chapter, stage, isBoss);

        if (this.random() >= band.chance) {
            return null;
        }

        const eligibleArtifacts = this.getEligibleArtifacts(chapter);

        if (eligibleArtifacts.length === 0) {
            return null;
        }

        const artifactIndex = Math.floor(
            this.random() * eligibleArtifacts.length,
        );
        const amountRange = band.maxAmount - band.minAmount + 1;
        const amount =
            band.minAmount +
            Math.floor(this.random() * amountRange);

        return {
            artifactId: eligibleArtifacts[artifactIndex].id,
            amount,
        };
    }

    private getEligibleArtifacts(
        chapter: number,
    ): ReadonlyArray<ArtifactDefinition> {
        const unlocked = this.definitions.filter(
            (definition) => definition.unlockChapter <= chapter,
        );

        if (unlocked.length === 0) {
            return [];
        }

        const newestChapter = Math.max(
            ...unlocked.map((definition) => definition.unlockChapter),
        );

        return unlocked.filter(
            (definition) => definition.unlockChapter === newestChapter,
        );
    }
}
