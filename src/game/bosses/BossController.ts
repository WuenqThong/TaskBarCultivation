import type { Enemy } from "../entities/Enemy";
import type { BossDefinition } from "./BossDefinition";
import type { BossPhaseDefinition, BossSummonConfig } from "./BossPhase";
import type { BossSkillDefinition, BossSkillState } from "./BossSkill";
import { BossSkillType } from "./BossSkill";

export interface BossControllerCallbacks {
    isPlayerAlive: () => boolean;
    canUseTargetedSkill: () => boolean;
    dealDamageToPlayer: (damage: number) => void;
    onSkillCast?: (skill: BossSkillDefinition) => void;
    onPhaseChanged?: (phase: BossPhaseDefinition, phaseIndex: number) => void;
    onSummonRequested?: (summon: BossSummonConfig) => void;
}

export class BossController {
    private boss: Enemy;
    private definition: BossDefinition;
    private callbacks: BossControllerCallbacks;
    private currentPhaseIndex: number;
    private enteredPhaseIds: Set<string>;
    private skillStates: Map<string, BossSkillState>;
    private globalSkillCooldown: number;
    private remainingBuffDuration: number;
    private destroyed: boolean;

    constructor(
        boss: Enemy,
        definition: BossDefinition,
        callbacks: BossControllerCallbacks,
    ) {
        this.boss = boss;
        this.definition = definition;
        this.callbacks = callbacks;
        this.currentPhaseIndex = -1;
        this.enteredPhaseIds = new Set();
        this.skillStates = new Map(
            definition.skills.map((skill) => [
                skill.id,
                {
                    skillId: skill.id,
                    remainingCooldown: skill.initialCooldown ?? skill.cooldown,
                },
            ]),
        );
        this.globalSkillCooldown = 0;
        this.remainingBuffDuration = 0;
        this.destroyed = false;

        this.updatePhase();
    }

    public update(deltaSeconds: number): void {
        if (this.destroyed || this.boss.isDead()) {
            return;
        }

        const delta = Math.max(0, deltaSeconds);

        this.updateTemporaryBuff(delta);
        this.updatePhase();
        this.updateCooldowns(delta);

        if (this.globalSkillCooldown > 0) {
            return;
        }

        this.tryCastSkill();
    }

    public getBoss(): Enemy {
        return this.boss;
    }

    public getCurrentPhaseIndex(): number {
        return Math.max(0, this.currentPhaseIndex);
    }

    public getCurrentPhase(): BossPhaseDefinition {
        return this.definition.phases[this.getCurrentPhaseIndex()];
    }

    public getEnteredPhaseIds(): ReadonlySet<string> {
        return this.enteredPhaseIds;
    }

    public getSkillState(skillId: string): BossSkillState | null {
        const state = this.skillStates.get(skillId);

        return state ? { ...state } : null;
    }

    public getRemainingBuffDuration(): number {
        return this.remainingBuffDuration;
    }

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.skillStates.clear();
        this.enteredPhaseIds.clear();
        this.remainingBuffDuration = 0;
        this.globalSkillCooldown = 0;
    }

    private updatePhase(): void {
        const hpRatio = this.boss.getHp() / this.boss.getMaxHp();
        let nextPhaseIndex = 0;

        for (let index = 0; index < this.definition.phases.length; index += 1) {
            if (hpRatio <= this.definition.phases[index].hpThreshold) {
                nextPhaseIndex = index;
            }
        }

        if (nextPhaseIndex === this.currentPhaseIndex) {
            return;
        }

        this.enterPhase(nextPhaseIndex);
    }

    private enterPhase(phaseIndex: number): void {
        const phase = this.definition.phases[phaseIndex];

        this.currentPhaseIndex = phaseIndex;
        this.boss.setPhaseMultipliers({
            attack: phase.attackMultiplier ?? 1,
            moveSpeed: phase.moveSpeedMultiplier ?? 1,
            attackSpeed: phase.attackSpeedMultiplier ?? 1,
        });

        if (this.enteredPhaseIds.has(phase.id)) {
            return;
        }

        this.enteredPhaseIds.add(phase.id);
        this.callbacks.onPhaseChanged?.(phase, phaseIndex);

        if (phase.summonOnEnter) {
            this.callbacks.onSummonRequested?.(phase.summonOnEnter);
        }
    }

    private updateTemporaryBuff(deltaSeconds: number): void {
        if (this.remainingBuffDuration <= 0) {
            return;
        }

        this.remainingBuffDuration = Math.max(
            0,
            this.remainingBuffDuration - deltaSeconds,
        );

        if (this.remainingBuffDuration === 0) {
            this.boss.setTemporaryAttackMultiplier(1);
        }
    }

    private updateCooldowns(deltaSeconds: number): void {
        this.globalSkillCooldown = Math.max(
            0,
            this.globalSkillCooldown - deltaSeconds,
        );

        const enabledSkillIds = new Set(
            this.getCurrentPhase().enabledSkillIds ?? [],
        );

        for (const state of this.skillStates.values()) {
            if (!enabledSkillIds.has(state.skillId)) {
                continue;
            }

            state.remainingCooldown = Math.max(
                0,
                state.remainingCooldown - deltaSeconds,
            );
        }
    }

    private tryCastSkill(): void {
        const enabledSkillIds = new Set(
            this.getCurrentPhase().enabledSkillIds ?? [],
        );
        const readySkills = this.definition.skills
            .filter((skill) => {
                const state = this.skillStates.get(skill.id);

                return enabledSkillIds.has(skill.id) &&
                    Boolean(state) &&
                    (state?.remainingCooldown ?? 1) <= 0;
            })
            .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

        for (const skill of readySkills) {
            if (!this.castSkill(skill)) {
                continue;
            }

            const state = this.skillStates.get(skill.id);

            if (state) {
                state.remainingCooldown = skill.cooldown;
            }

            this.globalSkillCooldown = this.definition.minimumSkillGap;
            this.callbacks.onSkillCast?.(skill);
            return;
        }
    }

    private castSkill(skill: BossSkillDefinition): boolean {
        if (skill.type === BossSkillType.HEAVY_ATTACK) {
            if (
                !this.callbacks.isPlayerAlive() ||
                !this.callbacks.canUseTargetedSkill()
            ) {
                return false;
            }

            this.callbacks.dealDamageToPlayer(
                this.boss.getAttack() * (skill.damageMultiplier ?? 1),
            );
            return true;
        }

        if (skill.type === BossSkillType.SELF_BUFF) {
            this.boss.setTemporaryAttackMultiplier(
                skill.buffAttackMultiplier ?? 1,
            );
            this.remainingBuffDuration = skill.buffDuration ?? 0;
            return true;
        }

        return false;
    }
}
