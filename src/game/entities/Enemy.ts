import {
    Container,
    Graphics,
    Text,
} from "pixi.js";
import type { EnemyDefinition } from "../enemies/EnemyDefinition";
import { EnemyArchetype, ENEMY_ARCHETYPE_LABELS } from "../enemies/EnemyArchetype";
import {
    BERSERKER_ENRAGE_ATTACK_MULTIPLIER,
    BERSERKER_ENRAGE_ATTACK_SPEED_MULTIPLIER,
    BERSERKER_ENRAGE_HP_RATIO,
    BERSERKER_ENRAGE_MOVE_SPEED_MULTIPLIER,
} from "../enemies/enemyArchetypeConfig";

export interface RuntimeEnemyStats {
    maxHp: number;
    attack: number;
    moveSpeed: number;
    attackInterval: number;
    attackRange: number;
}

export interface EnemyRuntimeOptions {
    rewardEnabled?: boolean;
}

export interface EnemyPhaseMultipliers {
    attack: number;
    moveSpeed: number;
    attackSpeed: number;
}

export class Enemy {
    private container: Container;
    private body: Graphics;
    private nameText: Text;
    private hpText: Text;

    private hp: number;
    private maxHp: number;
    private baseRuntimeAttack: number;
    private baseRuntimeMoveSpeed: number;
    private baseRuntimeAttackInterval: number;
    private attackRange: number;
    private attackTimer: number;
    private enraged: boolean;
    private definition: EnemyDefinition;
    private rewardEnabled: boolean;
    private phaseAttackMultiplier: number;
    private phaseMoveSpeedMultiplier: number;
    private phaseAttackSpeedMultiplier: number;
    private temporaryAttackMultiplier: number;

    constructor(
        definition: EnemyDefinition,
        stats: RuntimeEnemyStats,
        options: EnemyRuntimeOptions = {},
    ) {
        this.container = new Container();

        this.hp = stats.maxHp;
        this.maxHp = stats.maxHp;

        this.baseRuntimeAttack = stats.attack;
        this.baseRuntimeMoveSpeed = stats.moveSpeed;
        this.baseRuntimeAttackInterval = stats.attackInterval;
        this.attackRange = stats.attackRange;
        this.attackTimer = 0;
        this.enraged = false;
        this.definition = definition;
        this.rewardEnabled = options.rewardEnabled ?? true;
        this.phaseAttackMultiplier = 1;
        this.phaseMoveSpeedMultiplier = 1;
        this.phaseAttackSpeedMultiplier = 1;
        this.temporaryAttackMultiplier = 1;

        this.body = new Graphics();

        if (definition.isBoss) {
            this.body.rect(
                -35,
                -55,
                70,
                110,
            );

            this.body.fill("#b339ff");
        } else {
            this.body.rect(
                -20,
                -30,
                40,
                60,
            );

            this.body.fill("#ff5555");
        }

        this.nameText = new Text({
            text: definition.isBoss
                ? definition.name
                : `${definition.name}\n[${ENEMY_ARCHETYPE_LABELS[definition.archetype]}]`,
            style: {
                fill: "#ffffff",
                fontSize: definition.isBoss ? 16 : 13,
                fontWeight: "bold",
            },
        });

        this.nameText.anchor.set(0.5);
        this.nameText.y = definition.isBoss ? -85 : -55;

        this.hpText = new Text({
            text: `${this.formatNumber(this.hp)} / ${this.formatNumber(this.maxHp)}`,
            style: {
                fill: "#ffaaaa",
                fontSize: 12,
            },
        });

        this.hpText.anchor.set(0.5);
        this.hpText.y = definition.isBoss ? -68 : -40;

        this.container.addChild(
            this.body,
            this.nameText,
            this.hpText,
        );
    }

    public setPosition(
        x: number,
        y: number,
    ): void {
        this.container.position.set(
            x,
            y,
        );
    }

    public moveLeft(): void {
        this.container.x -= this.getMoveSpeed();
    }

    public getX(): number {
        return this.container.x;
    }

    public getAttack(): number {
        return this.baseRuntimeAttack *
            this.phaseAttackMultiplier *
            this.temporaryAttackMultiplier *
            (this.enraged ? BERSERKER_ENRAGE_ATTACK_MULTIPLIER : 1);
    }

    public getAttackInterval(): number {
        return this.baseRuntimeAttackInterval /
            this.phaseAttackSpeedMultiplier /
            (this.enraged ? BERSERKER_ENRAGE_ATTACK_SPEED_MULTIPLIER : 1);
    }

    public getMoveSpeed(): number {
        return this.baseRuntimeMoveSpeed *
            this.phaseMoveSpeedMultiplier *
            (this.enraged ? BERSERKER_ENRAGE_MOVE_SPEED_MULTIPLIER : 1);
    }

    public getHp(): number {
        return this.hp;
    }

    public getMaxHp(): number {
        return this.maxHp;
    }

    public isEnraged(): boolean {
        return this.enraged;
    }

    public update(deltaSeconds: number): void {
        if (this.isDead()) {
            return;
        }

        this.updateBehavior();
        this.attackTimer = Math.min(
            this.getAttackInterval(),
            this.attackTimer + Math.max(0, deltaSeconds),
        );
    }

    public updateBehavior(): void {
        if (
            this.isDead() ||
            this.enraged ||
            this.definition.archetype !== EnemyArchetype.BERSERKER
        ) {
            return;
        }

        if (this.hp / this.maxHp <= BERSERKER_ENRAGE_HP_RATIO) {
            this.enraged = true;
            this.body.tint = 0xff8888;
        }
    }

    public isAttackReady(): boolean {
        return !this.isDead() && this.attackTimer >= this.getAttackInterval();
    }

    public consumeAttack(): void {
        this.attackTimer = 0;
    }

    public isInAttackRange(targetX: number): boolean {
        return this.container.x - targetX <= this.attackRange;
    }

    public getDefinition(): EnemyDefinition {
        return this.definition;
    }

    public isRewardEnabled(): boolean {
        return this.rewardEnabled;
    }

    public setPhaseMultipliers(multipliers: EnemyPhaseMultipliers): void {
        this.phaseAttackMultiplier = Math.max(0.01, multipliers.attack);
        this.phaseMoveSpeedMultiplier = Math.max(0.01, multipliers.moveSpeed);
        this.phaseAttackSpeedMultiplier = Math.max(0.01, multipliers.attackSpeed);
    }

    public setTemporaryAttackMultiplier(multiplier: number): void {
        this.temporaryAttackMultiplier = Math.max(0.01, multiplier);
    }

    public takeDamage(
        damage: number,
    ): void {
        this.hp -= damage;

        if (this.hp < 0) {
            this.hp = 0;
        }

        this.hpText.text =
            `${this.formatNumber(this.hp)} / ${this.formatNumber(this.maxHp)}`;

        if (!this.isDead()) {
            this.updateBehavior();
        }
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }

    public getView(): Container {
        return this.container;
    }

    private formatNumber(value: number): string {
        return value.toFixed(2);
    }
}
