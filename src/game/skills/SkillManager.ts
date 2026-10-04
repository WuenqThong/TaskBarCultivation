import type { Player } from "../entities/Player";
import type { SkillDefinition } from "./Skill";
import type { SkillState } from "./SkillState";

export interface SkillEntry {
    definition: SkillDefinition;
    state: SkillState;
}

export class SkillManager {
    private player: Player;
    private definitions: Map<string, SkillDefinition>;
    private states: Map<string, SkillState>;
    private version: number;

    constructor(
        player: Player,
        definitions: ReadonlyArray<SkillDefinition>,
    ) {
        this.player = player;
        this.definitions = new Map<string, SkillDefinition>();
        this.states = new Map<string, SkillState>();
        this.version = 0;

        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
            this.states.set(definition.id, {
                skillId: definition.id,
                unlocked: true,
                level: 1,
                remainingCooldown: 0,
                autoCastEnabled: true,
            });
        }
    }

    public update(deltaSeconds: number): void {
        if (this.player.isDead() || deltaSeconds <= 0) {
            return;
        }

        for (const state of this.states.values()) {
            state.remainingCooldown = Math.max(
                0,
                state.remainingCooldown - deltaSeconds,
            );
        }
    }

    public canCast(skillId: string): boolean {
        const definition = this.definitions.get(skillId);
        const state = this.states.get(skillId);

        return Boolean(
            definition &&
            state?.unlocked &&
            state.remainingCooldown <= 0 &&
            !this.player.isDead() &&
            this.player.canSpendMp(definition.mpCost),
        );
    }

    public startCooldown(skillId: string): void {
        const state = this.states.get(skillId);

        if (state) {
            state.remainingCooldown = this.getEffectiveCooldown(skillId);
        }
    }

    public getRemainingCooldown(skillId: string): number {
        return this.states.get(skillId)?.remainingCooldown ?? 0;
    }

    public getEffectiveCooldown(skillId: string): number {
        const definition = this.definitions.get(skillId);

        if (!definition) {
            return 0;
        }

        const cooldownRecovery = Math.max(
            0,
            this.player.getSkillCooldownRecovery(),
        );

        return definition.baseCooldown / (1 + cooldownRecovery);
    }

    public setAutoCast(skillId: string, enabled: boolean): void {
        const state = this.states.get(skillId);

        if (state) {
            state.autoCastEnabled = enabled;
            this.version += 1;
        }
    }

    public getSkillState(skillId: string): SkillState | null {
        const state = this.states.get(skillId);

        return state ? { ...state } : null;
    }

    public getSkillDefinition(skillId: string): SkillDefinition | null {
        return this.definitions.get(skillId) ?? null;
    }

    public getAllSkills(): SkillEntry[] {
        const entries: SkillEntry[] = [];

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

    public resetCooldowns(): void {
        for (const state of this.states.values()) {
            state.remainingCooldown = 0;
        }
    }

    public restoreStates(savedStates: ReadonlyArray<{
        skillId: string;
        unlocked: boolean;
        level: number;
        autoCastEnabled: boolean;
    }>): void {
        const savedById = new Map(
            savedStates.map((state) => [state.skillId, state]),
        );

        for (const [skillId, state] of this.states) {
            const savedState = savedById.get(skillId);

            state.unlocked = savedState?.unlocked ?? true;
            state.level = savedState
                ? Math.max(1, Math.floor(savedState.level))
                : 1;
            state.autoCastEnabled = savedState?.autoCastEnabled ?? true;
            state.remainingCooldown = 0;
        }

        this.version += 1;
    }

    public reset(): void {
        this.restoreStates([]);
    }

    public getVersion(): number {
        return this.version;
    }
}
