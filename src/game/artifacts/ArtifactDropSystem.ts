import type { ArtifactDefinition } from "./Artifact";
import {
    ARTIFACT_FRAGMENT_DROP_CHANCE,
    ARTIFACT_FRAGMENT_DROP_MAX,
    ARTIFACT_FRAGMENT_DROP_MIN,
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

    public rollDrop(chapter: number): ArtifactFragmentDrop | null {
        if (this.random() >= ARTIFACT_FRAGMENT_DROP_CHANCE) {
            return null;
        }

        const eligibleArtifacts = this.getEligibleArtifacts(chapter);

        if (eligibleArtifacts.length === 0) {
            return null;
        }

        const artifactIndex = Math.floor(
            this.random() * eligibleArtifacts.length,
        );
        const amountRange =
            ARTIFACT_FRAGMENT_DROP_MAX -
            ARTIFACT_FRAGMENT_DROP_MIN +
            1;
        const amount =
            ARTIFACT_FRAGMENT_DROP_MIN +
            Math.floor(this.random() * amountRange);

        return {
            artifactId: eligibleArtifacts[artifactIndex].id,
            amount,
        };
    }

    private getEligibleArtifacts(
        chapter: number,
    ): ReadonlyArray<ArtifactDefinition> {
        void chapter;

        return this.definitions;
    }
}
