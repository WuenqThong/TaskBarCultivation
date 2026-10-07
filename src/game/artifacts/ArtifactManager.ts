import type { Player } from "../entities/Player";
import type { ArtifactDefinition } from "./Artifact";
import type { ArtifactState } from "./ArtifactState";
import { ARTIFACT_FRAGMENTS_REQUIRED } from "./artifactConfig";

export class ArtifactManager {
    private player: Player;
    private definitions: Map<string, ArtifactDefinition>;
    private states: Map<string, ArtifactState>;
    private equippedArtifactId: string | null;
    private version: number;
    private progressionSlotLimit: number;

    constructor(
        player: Player,
        definitions: ReadonlyArray<ArtifactDefinition>,
    ) {
        this.player = player;
        this.definitions = new Map<string, ArtifactDefinition>();
        this.states = new Map<string, ArtifactState>();
        this.equippedArtifactId = null;
        this.version = 0;
        this.progressionSlotLimit = 1;

        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
            this.states.set(definition.id, {
                artifactId: definition.id,
                fragmentCount: 0,
                owned: false,
                equipped: false,
                level: 1,
            });
        }
    }

    public addFragments(
        artifactId: string,
        amount: number,
    ): void {
        const state = this.states.get(artifactId);
        const fragmentAmount = Math.floor(amount);

        if (!state || fragmentAmount <= 0) {
            return;
        }

        state.fragmentCount += fragmentAmount;
        this.version += 1;
    }

    public getFragmentCount(artifactId: string): number {
        return this.states.get(artifactId)?.fragmentCount ?? 0;
    }

    public canCraft(artifactId: string): boolean {
        const state = this.states.get(artifactId);

        return Boolean(
            state &&
            !state.owned &&
            state.fragmentCount >= ARTIFACT_FRAGMENTS_REQUIRED,
        );
    }

    public craft(artifactId: string): boolean {
        const state = this.states.get(artifactId);

        if (!state || !this.canCraft(artifactId)) {
            return false;
        }

        state.fragmentCount -= ARTIFACT_FRAGMENTS_REQUIRED;
        state.owned = true;
        this.version += 1;

        return true;
    }

    public isOwned(artifactId: string): boolean {
        return this.states.get(artifactId)?.owned ?? false;
    }

    public equip(artifactId: string): boolean {
        if (this.progressionSlotLimit < 1) {
            return false;
        }

        const definition = this.definitions.get(artifactId);
        const state = this.states.get(artifactId);

        if (!definition || !state?.owned) {
            return false;
        }

        if (this.equippedArtifactId === artifactId) {
            return true;
        }

        if (this.equippedArtifactId) {
            this.removeArtifactModifiers(this.equippedArtifactId);
            const previousState = this.states.get(this.equippedArtifactId);

            if (previousState) {
                previousState.equipped = false;
            }
        }

        this.equippedArtifactId = artifactId;
        state.equipped = true;
        this.addArtifactModifiers(definition);
        this.player.syncCurrentResourcesWithMaxStats();
        this.version += 1;

        return true;
    }

    public unequip(): boolean {
        if (!this.equippedArtifactId) {
            return false;
        }

        const state = this.states.get(this.equippedArtifactId);

        this.removeArtifactModifiers(this.equippedArtifactId);
        if (state) {
            state.equipped = false;
        }

        this.equippedArtifactId = null;
        this.player.syncCurrentResourcesWithMaxStats();
        this.version += 1;

        return true;
    }

    public getEquippedArtifact(): ArtifactDefinition | null {
        if (!this.equippedArtifactId) {
            return null;
        }

        return this.definitions.get(this.equippedArtifactId) ?? null;
    }

    public getArtifactState(artifactId: string): ArtifactState {
        const state = this.states.get(artifactId);

        if (!state) {
            throw new Error(`Unknown artifact: ${artifactId}`);
        }

        return { ...state };
    }

    public getAllArtifactStates(): ArtifactState[] {
        return Array.from(
            this.states.values(),
            (state) => ({ ...state }),
        );
    }

    public getArtifactDefinition(
        artifactId: string,
    ): ArtifactDefinition | null {
        return this.definitions.get(artifactId) ?? null;
    }

    public getAllArtifactDefinitions(): ArtifactDefinition[] {
        return Array.from(this.definitions.values());
    }

    public getVersion(): number {
        return this.version;
    }

    public setProgressionSlotLimit(limit: number): void {
        const nextLimit = Math.max(0, Math.floor(limit));
        if (this.progressionSlotLimit === nextLimit) {
            return;
        }

        this.progressionSlotLimit = nextLimit;
        if (nextLimit < 1 && this.equippedArtifactId) {
            this.unequip();
        }
        this.version += 1;
    }

    public getProgressionSlotLimit(): number {
        return this.progressionSlotLimit;
    }

    public restoreStates(
        states: ReadonlyArray<{
            artifactId: string;
            fragmentCount: number;
            owned: boolean;
            level: number;
        }>,
        equippedArtifactId: string | null,
    ): void {
        if (this.equippedArtifactId) {
            this.removeArtifactModifiers(this.equippedArtifactId);
        }

        this.equippedArtifactId = null;

        for (const [artifactId] of this.definitions) {
            this.states.set(artifactId, {
                artifactId,
                fragmentCount: 0,
                owned: false,
                equipped: false,
                level: 1,
            });
        }

        for (const savedState of states) {
            const state = this.states.get(savedState.artifactId);

            if (!state) {
                continue;
            }

            state.fragmentCount = Math.max(0, Math.floor(savedState.fragmentCount));
            state.owned = savedState.owned;
            state.level = Math.max(1, Math.floor(savedState.level));
        }

        const equippedState = equippedArtifactId
            ? this.states.get(equippedArtifactId)
            : null;
        const equippedDefinition = equippedArtifactId
            ? this.definitions.get(equippedArtifactId)
            : null;

        if (equippedState?.owned && equippedDefinition) {
            equippedState.equipped = true;
            this.equippedArtifactId = equippedArtifactId;
            this.addArtifactModifiers(equippedDefinition);
        }

        this.player.syncCurrentResourcesWithMaxStats();
        this.version += 1;
    }

    public reset(): void {
        this.restoreStates([], null);
    }

    private addArtifactModifiers(
        definition: ArtifactDefinition,
    ): void {
        definition.baseModifiers.forEach((modifier, index) => {
            this.player.getStatSystem().addModifier({
                ...modifier,
                id: `artifact:${definition.id}:${index}`,
                source: `artifact:${definition.id}`,
            });
        });
    }

    private removeArtifactModifiers(artifactId: string): void {
        const definition = this.definitions.get(artifactId);

        definition?.baseModifiers.forEach((_modifier, index) => {
            this.player
                .getStatSystem()
                .removeModifier(`artifact:${artifactId}:${index}`);
        });
    }
}
