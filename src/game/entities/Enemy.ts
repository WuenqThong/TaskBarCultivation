import { AnimatedSprite, Container, Graphics, Text } from "pixi.js";
import type { EnemyDefinition } from "../enemies/EnemyDefinition";
import { EnemyArchetype, ENEMY_ARCHETYPE_LABELS } from "../enemies/EnemyArchetype";
import {
    BERSERKER_ENRAGE_ATTACK_MULTIPLIER,
    BERSERKER_ENRAGE_ATTACK_SPEED_MULTIPLIER,
    BERSERKER_ENRAGE_HP_RATIO,
    BERSERKER_ENRAGE_MOVE_SPEED_MULTIPLIER,
} from "../enemies/enemyArchetypeConfig";
import {
    getEnemyAnimationTextures,
    getEnemyVisualConfig,
    type EnemyAnimationState,
} from "../enemies/enemyAssets";
import { EnemyWorldHUD } from "../../ui/enemy/EnemyWorldHUD";

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
    private readonly container = new Container();
    private readonly definition: EnemyDefinition;
    private readonly body: AnimatedSprite;
    private readonly worldHud: EnemyWorldHUD | null;
    private hp: number;
    private maxHp: number;
    private baseRuntimeAttack: number;
    private baseRuntimeMoveSpeed: number;
    private baseRuntimeAttackInterval: number;
    private attackRange: number;
    private attackTimer = 0;
    private enraged = false;
    private rewardEnabled: boolean;
    private phaseAttackMultiplier = 1;
    private phaseMoveSpeedMultiplier = 1;
    private phaseAttackSpeedMultiplier = 1;
    private temporaryAttackMultiplier = 1;
    private phaseIndex = 0;
    private animationState: EnemyAnimationState = "idle";
    private deathAnimationComplete = false;
    private readonly debugText: Text | null;

    constructor(
        definition: EnemyDefinition,
        stats: RuntimeEnemyStats,
        options: EnemyRuntimeOptions = {},
    ) {
        this.definition = definition;
        this.hp = stats.maxHp;
        this.maxHp = stats.maxHp;
        this.baseRuntimeAttack = stats.attack;
        this.baseRuntimeMoveSpeed = stats.moveSpeed;
        this.baseRuntimeAttackInterval = stats.attackInterval;
        this.attackRange = stats.attackRange;
        this.rewardEnabled = options.rewardEnabled ?? true;

        const config = getEnemyVisualConfig(definition.id);
        this.body = new AnimatedSprite(getEnemyAnimationTextures(definition.id, "idle"));
        this.body.anchor.set(0.5);
        const visualScale = config?.scale ?? (definition.isBoss ? 0.38 : 0.30);
        // Enemy art is authored facing right, while enemies approach the player
        // from the right side of the battlefield. Flip only the animated body so
        // world-space HUD/nameplates remain readable.
        this.body.scale.set(-visualScale, visualScale);
        this.body.animationSpeed = (config?.fps.idle ?? 5) / 60;
        this.body.loop = true;
        this.body.roundPixels = true;
        this.body.play();
        this.container.addChild(this.body);

        this.worldHud = definition.isBoss
            ? null
            : new EnemyWorldHUD(definition.name, ENEMY_ARCHETYPE_LABELS[definition.archetype]);
        if (this.worldHud) {
            this.worldHud.getView().position.set(0, -72);
            this.worldHud.setHP(this.hp, this.maxHp);
            this.container.addChild(this.worldHud.getView());
        }

        const debugEnabled = import.meta.env.DEV &&
            new URLSearchParams(window.location.search).has("enemyDebug");
        if (debugEnabled) {
            const debug = new Graphics()
                .circle(0, 0, 3).fill(0xff00ff)
                .rect(-55, -48, 110, 96).stroke({ color: 0x00ffff, width: 1 })
                .moveTo(0, 0).lineTo(-this.attackRange, 0).stroke({ color: 0xffcc00, width: 1, alpha: 0.8 });
            this.debugText = new Text({
                text: "",
                style: { fill: 0xffffff, fontSize: 9, stroke: { color: 0x000000, width: 2 } },
            });
            this.debugText.position.set(-54, 50);
            this.container.addChild(debug, this.debugText);
            this.updateDebugText();
        } else {
            this.debugText = null;
        }
    }

    public setPosition(x: number, y: number): void {
        this.container.position.set(Math.round(x), Math.round(y));
    }

    public moveLeft(): void {
        this.container.x = Math.round(this.container.x - this.getMoveSpeed());
        if (this.animationState !== "attack" && this.animationState !== "hurt") {
            this.playAnimation("move", true);
        }
    }

    public getX(): number { return this.container.x; }

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

    public getHp(): number { return this.hp; }
    public getMaxHp(): number { return this.maxHp; }
    public isEnraged(): boolean { return this.enraged; }

    public update(deltaSeconds: number): void {
        if (this.isDead()) return;
        this.updateBehavior();
        this.attackTimer = Math.min(
            this.getAttackInterval(),
            this.attackTimer + Math.max(0, deltaSeconds),
        );
        this.updateDebugText();
    }

    public updateBehavior(): void {
        if (
            this.isDead() ||
            this.enraged ||
            this.definition.archetype !== EnemyArchetype.BERSERKER
        ) return;

        if (this.hp / this.maxHp <= BERSERKER_ENRAGE_HP_RATIO) {
            this.enraged = true;
            this.body.tint = 0xff7777;
            const config = getEnemyVisualConfig(this.definition.id);
            this.body.animationSpeed = ((config?.fps.special ?? 10) / 60) * 1.15;
            this.worldHud?.setEnraged(true);
        }
    }

    public isAttackReady(): boolean {
        return !this.isDead() && this.attackTimer >= this.getAttackInterval();
    }

    public consumeAttack(): void {
        this.attackTimer = 0;
        this.playAnimation("attack", false);
    }

    public isInAttackRange(targetX: number): boolean {
        return this.container.x - targetX <= this.attackRange;
    }

    public getDefinition(): EnemyDefinition { return this.definition; }
    public isRewardEnabled(): boolean { return this.rewardEnabled; }

    public setPhaseMultipliers(multipliers: EnemyPhaseMultipliers): void {
        this.phaseAttackMultiplier = Math.max(0.01, multipliers.attack);
        this.phaseMoveSpeedMultiplier = Math.max(0.01, multipliers.moveSpeed);
        this.phaseAttackSpeedMultiplier = Math.max(0.01, multipliers.attackSpeed);
    }

    public setBossPhaseVisual(phaseIndex: number): void {
        if (!this.definition.isBoss) return;
        this.phaseIndex = Math.max(0, Math.min(2, Math.floor(phaseIndex)));
        this.body.tint = 0xffffff;
        this.playAnimation("special", false, true);
    }

    public setTemporaryAttackMultiplier(multiplier: number): void {
        this.temporaryAttackMultiplier = Math.max(0.01, multiplier);
    }

    public takeDamage(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
        this.worldHud?.setHP(this.hp, this.maxHp);

        if (this.isDead()) {
            this.playAnimation("death", false, true);
            return;
        }

        this.updateBehavior();
        this.playAnimation("hurt", false, true);
    }

    public isDead(): boolean { return this.hp <= 0; }
    public isRemovalReady(): boolean { return !this.isDead() || this.deathAnimationComplete; }
    public getView(): Container { return this.container; }

    private playAnimation(state: EnemyAnimationState, loop: boolean, force = false): void {
        if (!force && this.animationState === state) return;
        if (!force && (this.animationState === "attack" || this.animationState === "hurt") && this.body.playing) {
            return;
        }
        const config = getEnemyVisualConfig(this.definition.id);
        this.animationState = state;
        this.body.textures = getEnemyAnimationTextures(this.definition.id, state, this.phaseIndex);
        this.body.animationSpeed = (config?.fps[state] ?? 6) / 60;
        if (this.enraged && state !== "death") this.body.animationSpeed *= 1.15;
        this.body.loop = loop;
        this.body.gotoAndPlay(0);
        this.body.onComplete = loop
            ? undefined
            : state === "death"
                ? () => { this.deathAnimationComplete = true; }
                : () => this.playAnimation("idle", true, true);
    }

    private updateDebugText(): void {
        if (!this.debugText) return;
        this.debugText.text = [
            `${this.definition.id} · ${ENEMY_ARCHETYPE_LABELS[this.definition.archetype]}`,
            `HP ${Math.ceil(this.hp)}/${Math.ceil(this.maxHp)} · range ${this.attackRange}`,
            this.definition.isBoss ? `phase ${this.phaseIndex + 1}` : (this.enraged ? "BERSERK" : "normal"),
        ].join("\n");
    }
}

