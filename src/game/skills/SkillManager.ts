import type { Player } from "../entities/Player";
import type { SkillDefinition } from "./Skill";
import type { SkillState } from "./SkillState";

export interface SkillEntry {
    definition: SkillDefinition;
    state: SkillState;
}

const LOADOUT_SLOT_COUNT = 5;

export class SkillManager {
    private player: Player;
    private definitions: Map<string, SkillDefinition>;
    private states: Map<string, SkillState>;
    private version: number;
    private initiallyUnlockedSkillIds: Set<string>;
    private unlockedSlotCount: number;
    private loadout: Array<string | null>;

    constructor(
        player: Player,
        definitions: ReadonlyArray<SkillDefinition>,
        initiallyUnlockedSkillIds: ReadonlyArray<string> = [],
    ) {
        this.player = player;
        this.definitions = new Map<string, SkillDefinition>();
        this.states = new Map<string, SkillState>();
        this.version = 0;
        this.initiallyUnlockedSkillIds = new Set(initiallyUnlockedSkillIds);
        this.unlockedSlotCount = 1;
        this.loadout = Array<string | null>(LOADOUT_SLOT_COUNT).fill(null);

        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
            this.states.set(definition.id, {
                skillId: definition.id,
                unlocked: this.initiallyUnlockedSkillIds.has(definition.id),
                level: 1,
                remainingCooldown: 0,
                autoCastEnabled: true,
                phase: "ready",
            });
        }

        this.fillEmptyLoadoutSlots();
    }

    public update(deltaSeconds: number): void {
        if (this.player.isDead() || deltaSeconds <= 0) return;

        for (const state of this.states.values()) {
            state.remainingCooldown = Math.max(0, state.remainingCooldown - deltaSeconds);
            if (state.remainingCooldown <= 0 && state.phase === "cooldown") {
                state.phase = "ready";
            }
        }
    }

    public canCast(skillId: string): boolean {
        const state = this.states.get(skillId);
        return Boolean(
            this.definitions.has(skillId) &&
            state?.unlocked &&
            this.isEquipped(skillId) &&
            state.remainingCooldown <= 0 &&
            state.phase === "ready" &&
            !this.player.isDead() &&
            this.player.canSpendMp(this.getEffectiveMpCost(skillId)),
        );
    }

    public startCooldown(skillId: string): void {
        const state = this.states.get(skillId);
        if (state) {
            state.remainingCooldown = this.getEffectiveCooldown(skillId);
            state.phase = "cooldown";
        }
    }

    public setPhase(skillId: string, phase: SkillState["phase"]): void {
        const state = this.states.get(skillId);
        if (state) state.phase = phase;
    }

    public getCooldownProgress(skillId: string): number {
        const total = this.getEffectiveCooldown(skillId);
        if (total <= 0) return 0;
        return Math.max(0, Math.min(1, this.getRemainingCooldown(skillId) / total));
    }

    public getRemainingCooldown(skillId: string): number {
        return this.states.get(skillId)?.remainingCooldown ?? 0;
    }

    public getEffectiveCooldown(skillId: string): number {
        const baseCooldown = this.getEffectiveBaseCooldown(skillId);
        const cooldownRecovery = Math.max(0, this.player.getSkillCooldownRecovery());
        return baseCooldown / (1 + cooldownRecovery);
    }

    public getEffectiveBaseCooldown(skillId: string): number {
        const definition = this.definitions.get(skillId);
        const state = this.states.get(skillId);
        if (!definition || !state) return 0;
        const levelOffset = Math.max(0, state.level - 1);
        return Math.max(
            0.2,
            definition.baseCooldown +
                (definition.progression.cooldownPerLevel ?? 0) * levelOffset,
        );
    }

    public getEffectiveMpCost(skillId: string): number {
        const definition = this.definitions.get(skillId);
        const state = this.states.get(skillId);
        if (!definition || !state) return 0;
        const levelOffset = Math.max(0, state.level - 1);
        return this.roundStat(Math.max(
            0,
            definition.mpCost +
                (definition.progression.mpCostPerLevel ?? 0) * levelOffset,
        ));
    }

    public getEffectiveDamageMultiplier(skillId: string): number {
        const definition = this.definitions.get(skillId);
        const state = this.states.get(skillId);
        if (!definition || !state) return 1;
        const levelOffset = Math.max(0, state.level - 1);
        return this.roundStat(Math.max(
            0,
            (definition.damageMultiplier ?? 1) +
                (definition.progression.damageMultiplierPerLevel ?? 0) * levelOffset,
        ));
    }

    public getEffectiveHealPercent(skillId: string): number {
        const definition = this.definitions.get(skillId);
        const state = this.states.get(skillId);
        if (!definition || !state) return 0;
        const levelOffset = Math.max(0, state.level - 1);
        return this.roundStat(Math.max(
            0,
            (definition.healPercent ?? 0) +
                (definition.progression.healPercentPerLevel ?? 0) * levelOffset,
        ));
    }

    public getUpgradeCost(skillId: string): number | null {
        const definition = this.definitions.get(skillId);
        const state = this.states.get(skillId);
        if (!definition || !state || state.level >= definition.progression.maxLevel) {
            return null;
        }
        return Math.max(
            1,
            Math.round(
                definition.progression.upgradeCostBase *
                Math.pow(definition.progression.upgradeCostGrowth, state.level - 1),
            ),
        );
    }

    public upgradeSkill(
        skillId: string,
        spendCurrency: (cost: number) => boolean,
    ): boolean {
        const state = this.states.get(skillId);
        const cost = this.getUpgradeCost(skillId);
        if (!state?.unlocked || cost === null || !spendCurrency(cost)) {
            return false;
        }

        state.level += 1;
        this.version += 1;
        return true;
    }

    public setAutoCast(skillId: string, enabled: boolean): void {
        const state = this.states.get(skillId);
        if (state && state.autoCastEnabled !== enabled) {
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
            if (state) entries.push({ definition, state: { ...state } });
        }
        return entries;
    }

    public resetCooldowns(): void {
        for (const state of this.states.values()) {
            state.remainingCooldown = 0;
            state.phase = "ready";
        }
    }

    public setProgressionUnlockedSkills(skillIds: ReadonlySet<string>): void {
        let changed = false;
        for (const [skillId, state] of this.states) {
            const unlocked = skillIds.has(skillId);
            if (state.unlocked !== unlocked) {
                state.unlocked = unlocked;
                changed = true;
            }
        }

        for (let index = 0; index < this.loadout.length; index += 1) {
            const skillId = this.loadout[index];
            if (skillId && !skillIds.has(skillId)) {
                this.loadout[index] = null;
                changed = true;
            }
        }

        if (this.fillEmptyLoadoutSlots()) changed = true;
        if (changed) this.version += 1;
    }

    public setProgressionSlotCount(count: number): void {
        const nextCount = Math.max(1, Math.min(LOADOUT_SLOT_COUNT, Math.floor(count)));
        if (this.unlockedSlotCount === nextCount) return;

        this.unlockedSlotCount = nextCount;
        for (let index = nextCount; index < LOADOUT_SLOT_COUNT; index += 1) {
            this.loadout[index] = null;
        }
        this.fillEmptyLoadoutSlots();
        this.version += 1;
    }

    public getUnlockedSlotCount(): number {
        return this.unlockedSlotCount;
    }

    public getLoadout(): Array<string | null> {
        return [...this.loadout];
    }

    public getEquippedSkillId(slotIndex: number): string | null {
        if (slotIndex < 0 || slotIndex >= this.unlockedSlotCount) return null;
        return this.loadout[slotIndex] ?? null;
    }

    public getEquippedSkillIds(): string[] {
        return this.loadout
            .slice(0, this.unlockedSlotCount)
            .filter((skillId): skillId is string => Boolean(skillId));
    }

    public isEquipped(skillId: string): boolean {
        return this.loadout
            .slice(0, this.unlockedSlotCount)
            .includes(skillId);
    }

    public equipSkill(skillId: string, slotIndex: number): boolean {
        const state = this.states.get(skillId);
        if (
            !state?.unlocked ||
            slotIndex < 0 ||
            slotIndex >= this.unlockedSlotCount ||
            slotIndex >= LOADOUT_SLOT_COUNT ||
            (slotIndex === 0 && !this.initiallyUnlockedSkillIds.has(skillId))
        ) {
            return false;
        }

        const previousIndex = this.loadout.indexOf(skillId);
        if (previousIndex === 0 && slotIndex !== 0) {
            return false;
        }
        const displaced = this.loadout[slotIndex];
        if (previousIndex === slotIndex) return true;

        if (previousIndex >= 0) {
            this.loadout[previousIndex] = displaced;
        }
        this.loadout[slotIndex] = skillId;
        this.version += 1;
        return true;
    }

    public restoreStates(savedStates: ReadonlyArray<{
        skillId: string;
        unlocked: boolean;
        level: number;
        autoCastEnabled: boolean;
    }>): void {
        const savedById = new Map(savedStates.map((state) => [state.skillId, state]));

        for (const [skillId, state] of this.states) {
            const savedState = savedById.get(skillId);
            const definition = this.definitions.get(skillId);
            state.unlocked = savedState?.unlocked ?? this.initiallyUnlockedSkillIds.has(skillId);
            state.level = savedState && definition
                ? Math.min(
                    definition.progression.maxLevel,
                    Math.max(1, Math.floor(savedState.level)),
                )
                : 1;
            state.autoCastEnabled = savedState?.autoCastEnabled ?? true;
            state.remainingCooldown = 0;
            state.phase = "ready";
        }

        this.version += 1;
    }

    public restoreLoadout(savedLoadout: ReadonlyArray<string | null> | undefined): void {
        this.loadout = Array<string | null>(LOADOUT_SLOT_COUNT).fill(null);
        const used = new Set<string>();

        if (savedLoadout) {
            savedLoadout.slice(0, LOADOUT_SLOT_COUNT).forEach((skillId, index) => {
                if (
                    skillId &&
                    !used.has(skillId) &&
                    this.states.get(skillId)?.unlocked
                ) {
                    this.loadout[index] = skillId;
                    used.add(skillId);
                }
            });
        }

        this.fillEmptyLoadoutSlots();
        this.version += 1;
    }

    public reset(): void {
        this.restoreStates([]);
        this.unlockedSlotCount = 1;
        this.loadout = Array<string | null>(LOADOUT_SLOT_COUNT).fill(null);
        this.fillEmptyLoadoutSlots();
        this.version += 1;
    }

    public getVersion(): number {
        return this.version;
    }

    private fillEmptyLoadoutSlots(): boolean {
        let changed = false;
        const equipped = new Set(this.loadout.filter((skillId): skillId is string => Boolean(skillId)));
        const candidates = Array.from(this.states.values())
            .filter((state) => state.unlocked && !equipped.has(state.skillId))
            .map((state) => state.skillId);

        for (let index = 0; index < this.unlockedSlotCount; index += 1) {
            if (this.loadout[index]) continue;
            const nextSkill = candidates.shift();
            if (!nextSkill) break;
            this.loadout[index] = nextSkill;
            equipped.add(nextSkill);
            changed = true;
        }

        return changed;
    }

    private roundStat(value: number): number {
        return Math.round(value * 100) / 100;
    }
}

