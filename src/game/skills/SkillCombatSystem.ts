import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import {
    SkillEffectType,
    SkillTargetType,
} from "./Skill";
import type { SkillDefinition } from "./Skill";
import type { SkillManager } from "./SkillManager";
import { SKILL_IDS } from "./skillData";

export interface SkillDamageEvent {
    enemy: Enemy;
    damage: number;
    isCritical: boolean;
}

interface SkillCombatCallbacks {
    onDamage: (event: SkillDamageEvent) => void;
    onHeal: (amount: number) => void;
}

const AUTO_CAST_PRIORITY: ReadonlyArray<string> = [
    SKILL_IDS.ORIGIN_RECOVERY,
    SKILL_IDS.TEN_THOUSAND_SWORDS,
    SKILL_IDS.SWORD_QI,
];

export class SkillCombatSystem {
    private player: Player;
    private skillManager: SkillManager;
    private getEnemies: () => ReadonlyArray<Enemy>;
    private callbacks: SkillCombatCallbacks;

    constructor(
        player: Player,
        skillManager: SkillManager,
        getEnemies: () => ReadonlyArray<Enemy>,
        callbacks: SkillCombatCallbacks,
    ) {
        this.player = player;
        this.skillManager = skillManager;
        this.getEnemies = getEnemies;
        this.callbacks = callbacks;
    }

    public updateAutoCast(): boolean {
        for (const skillId of AUTO_CAST_PRIORITY) {
            const state = this.skillManager.getSkillState(skillId);

            if (state?.autoCastEnabled && this.shouldAutoCast(skillId)) {
                return this.cast(skillId);
            }
        }

        return false;
    }

    public cast(skillId: string): boolean {
        const definition = this.skillManager.getSkillDefinition(skillId);

        if (!definition || !this.skillManager.canCast(skillId)) {
            return false;
        }

        const livingEnemies = this.getLivingEnemies();

        if (
            definition.targetType !== SkillTargetType.SELF &&
            livingEnemies.length === 0
        ) {
            return false;
        }

        if (!this.player.spendMp(definition.mpCost)) {
            return false;
        }

        this.applyEffect(definition, livingEnemies);
        this.skillManager.startCooldown(skillId);

        return true;
    }

    private shouldAutoCast(skillId: string): boolean {
        if (!this.skillManager.canCast(skillId)) {
            return false;
        }

        const livingEnemyCount = this.getLivingEnemies().length;

        if (skillId === SKILL_IDS.ORIGIN_RECOVERY) {
            return this.player.getHp() / this.player.getMaxHp() <= 0.5;
        }

        if (skillId === SKILL_IDS.TEN_THOUSAND_SWORDS) {
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
                this.player.getMaxHp() * (definition.healPercent ?? 0),
            );

            this.callbacks.onHeal(healAmount);
            return;
        }

        const targets = definition.targetType === SkillTargetType.ALL_ENEMIES
            ? livingEnemies
            : [this.getNearestEnemy(livingEnemies)];

        for (const enemy of targets) {
            if (!enemy) {
                continue;
            }

            const result = this.player.calculateDamage(
                definition.damageMultiplier ?? 1,
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
}
