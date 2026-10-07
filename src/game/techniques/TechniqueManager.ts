import type { PlayerStatSystem } from "../stats/PlayerStatSystem";
import type {
    TechniqueDefinition,
    TechniqueMilestone,
} from "./Technique";
import type { TechniqueState } from "./TechniqueState";

export interface TechniqueEntry {
    definition: TechniqueDefinition;
    state: TechniqueState;
}

export class TechniqueManager {
    private statSystem: PlayerStatSystem;
    private syncResourceLimits: () => void;
    private definitions: Map<string, TechniqueDefinition>;
    private states: Map<string, TechniqueState>;
    private version: number;
    private progressionSlotLimit: number;

    constructor(
        statSystem: PlayerStatSystem,
        definitions: ReadonlyArray<TechniqueDefinition>,
        syncResourceLimits: () => void,
    ) {
        this.statSystem = statSystem;
        this.syncResourceLimits = syncResourceLimits;
        this.definitions = new Map<string, TechniqueDefinition>();
        this.states = new Map<string, TechniqueState>();
        this.version = 0;
        this.progressionSlotLimit = Number.POSITIVE_INFINITY;

        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
            this.states.set(definition.id, {
                techniqueId: definition.id,
                learned: false,
                level: 0,
            });
        }
    }

    public learnTechnique(techniqueId: string): boolean {
        const definition = this.definitions.get(techniqueId);
        const state = this.states.get(techniqueId);

        if (
            !definition ||
            !state ||
            state.learned ||
            this.getLearnedTechniqueCount() >= this.progressionSlotLimit
        ) {
            return false;
        }

        const previousLevel = state.level;

        state.learned = true;
        state.level = 1;
        this.applyNewMilestones(definition, previousLevel, state.level);
        this.syncResourceLimits();
        this.version += 1;

        return true;
    }

    public upgradeTechnique(techniqueId: string): boolean {
        const definition = this.definitions.get(techniqueId);
        const state = this.states.get(techniqueId);

        if (
            !definition ||
            !state?.learned ||
            state.level >= definition.maxLevel
        ) {
            return false;
        }

        const previousLevel = state.level;

        state.level += 1;
        this.applyNewMilestones(definition, previousLevel, state.level);
        this.syncResourceLimits();
        this.version += 1;

        return true;
    }

    public isLearned(techniqueId: string): boolean {
        return this.states.get(techniqueId)?.learned ?? false;
    }

    public getLevel(techniqueId: string): number {
        return this.states.get(techniqueId)?.level ?? 0;
    }

    public getTechniqueState(
        techniqueId: string,
    ): TechniqueState | null {
        const state = this.states.get(techniqueId);

        return state ? { ...state } : null;
    }

    public getTechniqueDefinition(
        techniqueId: string,
    ): TechniqueDefinition | null {
        return this.definitions.get(techniqueId) ?? null;
    }

    public getAllTechniques(): TechniqueEntry[] {
        const entries: TechniqueEntry[] = [];

        for (const definition of this.definitions.values()) {
            const state = this.states.get(definition.id);

            if (state) {
                entries.push({
                    definition,
                    state: { ...state },
                });
            }
        }

        return entries;
    }

    public applyActiveMilestones(techniqueId: string): boolean {
        const definition = this.definitions.get(techniqueId);
        const state = this.states.get(techniqueId);

        if (!definition || !state?.learned) {
            return false;
        }

        this.applyNewMilestones(definition, 0, state.level);
        this.syncResourceLimits();

        return true;
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
        this.version += 1;
    }

    public getProgressionSlotLimit(): number {
        return this.progressionSlotLimit;
    }

    public getLearnedTechniqueCount(): number {
        return Array.from(this.states.values()).filter((state) => state.learned).length;
    }

    public restoreStates(
        savedStates: ReadonlyArray<TechniqueState>,
    ): void {
        this.removeAllMilestoneModifiers();

        for (const [techniqueId] of this.definitions) {
            this.states.set(techniqueId, {
                techniqueId,
                learned: false,
                level: 0,
            });
        }

        for (const savedState of savedStates) {
            const definition = this.definitions.get(savedState.techniqueId);
            const state = this.states.get(savedState.techniqueId);

            if (!definition || !state) {
                continue;
            }

            state.learned = savedState.learned;
            state.level = savedState.learned
                ? Math.min(Math.max(Math.floor(savedState.level), 1), definition.maxLevel)
                : 0;

            if (state.learned) {
                this.applyNewMilestones(definition, 0, state.level);
            }
        }

        this.syncResourceLimits();
        this.version += 1;
    }

    public reset(): void {
        this.restoreStates([]);
    }

    private applyNewMilestones(
        definition: TechniqueDefinition,
        previousLevel: number,
        currentLevel: number,
    ): void {
        for (const milestone of definition.milestones) {
            if (
                milestone.requiredLevel > previousLevel &&
                milestone.requiredLevel <= currentLevel
            ) {
                this.applyMilestone(definition, milestone);
            }
        }
    }

    private applyMilestone(
        definition: TechniqueDefinition,
        milestone: TechniqueMilestone,
    ): void {
        milestone.modifiers.forEach((modifier, index) => {
            this.statSystem.addModifier({
                ...modifier,
                id:
                    `technique:${definition.id}:milestone:` +
                    `${milestone.requiredLevel}:${index}`,
                source: `technique:${definition.id}`,
            });
        });
    }

    private removeAllMilestoneModifiers(): void {
        for (const definition of this.definitions.values()) {
            for (const milestone of definition.milestones) {
                milestone.modifiers.forEach((_modifier, index) => {
                    this.statSystem.removeModifier(
                        `technique:${definition.id}:milestone:` +
                        `${milestone.requiredLevel}:${index}`,
                    );
                });
            }
        }
    }
}
