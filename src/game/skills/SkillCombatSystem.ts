import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import {
    SkillEffectType,
    SkillTargetType,
} from "./Skill";
import type { SkillDefinition } from "./Skill";
import type { SkillManager } from "./SkillManager";
import { SKILL_IDS } from "./skillData";
import type { SkillVfxSystem } from "./SkillVfxSystem";

export interface SkillDamageEvent {
    enemy: Enemy;
    damage: number;
    isCritical: boolean;
}

interface SkillCombatCallbacks {
    onDamage: (event: SkillDamageEvent) => void;
    onHeal: (amount: number) => void;
}

export class SkillCombatSystem {
    private player: Player;
    private skillManager: SkillManager;
    private getEnemies: () => ReadonlyArray<Enemy>;
    private callbacks: SkillCombatCallbacks;
    private vfx: SkillVfxSystem;

    constructor(
        player: Player,
        skillManager: SkillManager,
        getEnemies: () => ReadonlyArray<Enemy>,
        vfx: SkillVfxSystem,
        callbacks: SkillCombatCallbacks,
    ) {
        this.player = player;
        this.skillManager = skillManager;
        this.getEnemies = getEnemies;
        this.vfx = vfx;
        this.callbacks = callbacks;
    }

    public updateAutoCast(): boolean {
        const equipped = this.skillManager.getEquippedSkillIds()
            .filter((skillId) => skillId !== SKILL_IDS.NORMAL_SLASH)
            .sort((left, right) => this.getAutoCastPriority(left) - this.getAutoCastPriority(right));

        for (const skillId of equipped) {
            const state = this.skillManager.getSkillState(skillId);

            if (state?.autoCastEnabled && this.shouldAutoCast(skillId)) {
                return this.cast(skillId);
            }
        }

        return false;
    }

    public cast(skillId: string): boolean {
        const definition = this.skillManager.getSkillDefinition(skillId);

        if (
            !definition ||
            !this.skillManager.canCast(skillId) ||
            this.player.isCombatAnimationLocked()
        ) {
            return false;
        }

        const livingEnemies = this.getLivingEnemies();
        const nearestEnemy = this.getNearestEnemy(livingEnemies);

        if (
            definition.targetType !== SkillTargetType.SELF &&
            livingEnemies.length === 0
        ) {
            return false;
        }

        if (
            definition.targetType === SkillTargetType.SINGLE_ENEMY &&
            nearestEnemy &&
            Math.abs(nearestEnemy.getX() - this.player.getView().x) > (definition.range ?? 180)
        ) {
            return false;
        }

        if (!this.player.spendMp(this.skillManager.getEffectiveMpCost(skillId))) {
            return false;
        }

        this.skillManager.setPhase(skillId, "casting");
        if (definition.animation === "slash") {
            this.player.playAttack();
        } else {
            this.player.playSpell();
        }

        const activate = () => {
            this.skillManager.setPhase(skillId, "active");
            this.applyEffect(definition, livingEnemies);
        };
        const finish = () => this.skillManager.startCooldown(skillId);

        const vfxProfile = definition.vfxProfile ?? definition.id;
        if (vfxProfile === "normal-slash" && nearestEnemy) {
            this.vfx.playNormalSlash(nearestEnemy, { onHit: activate, onComplete: finish });
        } else if (vfxProfile === "sword-qi" && nearestEnemy) {
            this.vfx.playSwordQi(nearestEnemy, { onHit: activate, onComplete: finish });
        } else if (vfxProfile === "ten-thousand-swords") {
            this.vfx.playTenThousandSwords(livingEnemies, { onHit: activate, onComplete: finish });
        } else if (vfxProfile === "heal") {
            this.vfx.playHeal({ onHit: activate, onComplete: finish });
        } else {
            activate();
            finish();
        }

        return true;
    }

    private shouldAutoCast(skillId: string): boolean {
        if (!this.skillManager.canCast(skillId)) {
            return false;
        }

        const livingEnemyCount = this.getLivingEnemies().length;
        const definition = this.skillManager.getSkillDefinition(skillId);

        if (!definition) {
            return false;
        }

        if (definition.effectType === SkillEffectType.HEAL) {
            return this.player.getHp() / this.player.getMaxHp() <= 0.5;
        }

        if (definition.targetType === SkillTargetType.ALL_ENEMIES) {
            return livingEnemyCount >= 2;
        }

        return livingEnemyCount >= 1;
    }

    private applyEffect(
        definition: SkillDefinition,
        livingEnemies: Enemy[],
    ): void {
        if (definition.effectType === SkillEffectType.HEAL) {
            const healAmount = this.player.restoreHp(
                this.player.getMaxHp() * this.skillManager.getEffectiveHealPercent(definition.id),
            );

            this.callbacks.onHeal(healAmount);
            return;
        }

        const targets = definition.targetType === SkillTargetType.ALL_ENEMIES
            ? livingEnemies
            : [this.getNearestEnemy(livingEnemies)];

        for (const enemy of targets) {
            if (!enemy || enemy.isDead()) {
                continue;
            }

            const result = this.player.calculateDamage(
                this.skillManager.getEffectiveDamageMultiplier(definition.id),
            );

            enemy.takeDamage(result.damage);
            this.callbacks.onDamage({
                enemy,
                damage: result.damage,
                isCritical: result.isCritical,
            });
        }
    }

    private getLivingEnemies(): Enemy[] {
        return this.getEnemies().filter((enemy) => !enemy.isDead());
    }

    private getNearestEnemy(enemies: ReadonlyArray<Enemy>): Enemy | null {
        let nearest: Enemy | null = null;

        for (const enemy of enemies) {
            if (!nearest || enemy.getX() < nearest.getX()) {
                nearest = enemy;
            }
        }

        return nearest;
    }

    private getAutoCastPriority(skillId: string): number {
        const definition = this.skillManager.getSkillDefinition(skillId);
        if (!definition) return 99;
        if (definition.effectType === SkillEffectType.HEAL) return 0;
        if (definition.targetType === SkillTargetType.ALL_ENEMIES) return 1;
        return 2;
    }
}
