import {
    AnimatedSprite,
    Assets,
    Container,
    Text,
    Texture,
} from "pixi.js";
import { PlayerStatSystem } from "../stats/PlayerStatSystem";
import { StatType } from "../stats/StatType";

const HERO_ASSET_PATH =
    "/assets/hero";

const createFramePaths = (
    animation: string,
    frameCount: number,
): string[] =>
    Array.from(
        { length: frameCount },
        (_, index) =>
            `${HERO_ASSET_PATH}/${animation}/frame_${index
                .toString()
                .padStart(3, "0")}.png`,
    );

export class Player {
    private container: Container;
    private body: AnimatedSprite;
    private idleTextures: Texture[];
    private attackTextures: Texture[];
    private nameText: Text;
    private hpText: Text;
    private mpText: Text;

    private statSystem: PlayerStatSystem;
    private currentHp: number;
    private currentMp: number;

    private constructor(
        idleTextures: Texture[],
        attackTextures: Texture[],
    ) {
        this.container = new Container();

        this.idleTextures = idleTextures;
        this.attackTextures =
            attackTextures;

        this.statSystem = new PlayerStatSystem();
        this.currentHp = this.getMaxHp();
        this.currentMp = this.getMaxMp();

        this.body = new AnimatedSprite(
            this.idleTextures,
        );

        this.body.anchor.set(0.5);
        this.body.scale.set(1.5);
        this.body.animationSpeed = 0.08;
        this.body.loop = true;
        this.body.play();

        this.nameText = new Text({
            text: "Hero",
            style: {
                fill: "#ffffff",
                fontSize: 14,
                fontWeight: "bold",
            },
        });

        this.nameText.anchor.set(0.5);
        this.nameText.y = -75;

        this.hpText = new Text({
            text: `HP ${this.currentHp}/${this.getMaxHp()}`,
            style: {
                fill: "#7cff7c",
                fontSize: 13,
            },
        });

        this.hpText.anchor.set(0.5);
        this.hpText.y = -58;

        this.mpText = new Text({
            text: "",
            style: {
                fill: "#7cc7ff",
                fontSize: 13,
            },
        });

        this.mpText.anchor.set(0.5);
        this.mpText.y = -42;
        this.updateResourceTexts();

        this.container.addChild(
            this.body,
            this.nameText,
            this.hpText,
            this.mpText,
        );
    }

    public static async create(): Promise<Player> {
        const [idleTextures, attackTextures] =
            await Promise.all([
                Promise.all(
                    createFramePaths(
                        "walk",
                        6,
                    ).map((path) =>
                        Assets.load<Texture>(path),
                    ),
                ),
                Promise.all(
                    createFramePaths(
                        "slash",
                        6,
                    ).map((path) =>
                        Assets.load<Texture>(path),
                    ),
                ),
            ]);

        for (
            const texture of [
                ...idleTextures,
                ...attackTextures,
            ]
        ) {
            texture.source.scaleMode =
                "nearest";
        }

        return new Player(
            idleTextures,
            attackTextures,
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

    public getView(): Container {
        return this.container;
    }

    public getHp(): number {
        this.clampCurrentResources();

        return this.currentHp;
    }

    public getMaxHp(): number {
        return this.statSystem.getFinalStat(StatType.MAX_HP);
    }

    public getMp(): number {
        this.clampCurrentResources();

        return this.currentMp;
    }

    public getMaxMp(): number {
        return this.statSystem.getFinalStat(StatType.MAX_MP);
    }

    public getAttack(): number {
        return this.statSystem.getFinalStat(StatType.ATTACK);
    }

    public getDefense(): number {
        return this.statSystem.getFinalStat(StatType.DEFENSE);
    }

    public getCritRate(): number {
        return this.statSystem.getFinalStat(StatType.CRIT_RATE);
    }

    public getCritDamage(): number {
        return this.statSystem.getFinalStat(StatType.CRIT_DAMAGE);
    }

    public getCultivationSpeed(): number {
        return this.statSystem.getFinalStat(StatType.CULTIVATION_SPEED);
    }

    public getSkillCooldownRecovery(): number {
        return this.statSystem.getFinalStat(
            StatType.SKILL_COOLDOWN_RECOVERY,
        );
    }

    public getHpRegen(): number {
        return this.statSystem.getFinalStat(StatType.HP_REGEN);
    }

    public getMpRegen(): number {
        return this.statSystem.getFinalStat(StatType.MP_REGEN);
    }

    public getStatSystem(): PlayerStatSystem {
        return this.statSystem;
    }

    public syncCurrentResourcesWithMaxStats(): void {
        this.clampCurrentResources();
        this.updateResourceTexts();
    }

    public calculateDamage(multiplier = 1): {
        damage: number;
        isCritical: boolean;
    } {
        const isCritical = Math.random() < this.getCritRate();
        const criticalMultiplier = isCritical ? this.getCritDamage() : 1;

        return {
            damage: Math.max(
                0,
                Math.round(this.getAttack() * multiplier * criticalMultiplier * 100) / 100,
            ),
            isCritical,
        };
    }

    public calculateAttackDamage(): {
        damage: number;
        isCritical: boolean;
    } {
        return this.calculateDamage();
    }

    public playAttack(): void {
        this.body.stop();
        this.body.textures =
            this.attackTextures;
        this.body.loop = false;
        this.body.animationSpeed = 0.35;
        this.body.onComplete = () => {
            this.body.onComplete = undefined;
            this.body.textures =
                this.idleTextures;
            this.body.loop = true;
            this.body.animationSpeed = 0.08;
            this.body.play();
        };
        this.body.gotoAndPlay(0);
    }

    public takeDamage(
        damage: number,
    ): number {
        const finalDamage = Math.max(
            damage - this.getDefense(),
            1,
        );

        this.currentHp -= finalDamage;

        if (this.currentHp < 0) {
            this.currentHp = 0;
        }

        this.updateResourceTexts();

        return finalDamage;
    }

    public isDead(): boolean {
        return this.currentHp <= 0;
    }

    public restoreFullHp(): void {
        this.currentHp = this.getMaxHp();

        this.updateResourceTexts();
    }

    public restoreFullMp(): void {
        this.currentMp = this.getMaxMp();
        this.updateResourceTexts();
    }

    public restoreFullResources(): void {
        this.currentHp = this.getMaxHp();
        this.currentMp = this.getMaxMp();
        this.updateResourceTexts();
    }

    public canSpendMp(amount: number): boolean {
        return amount >= 0 && this.getMp() >= amount;
    }

    public spendMp(amount: number): boolean {
        if (!this.canSpendMp(amount)) {
            return false;
        }

        this.currentMp = Math.max(0, this.currentMp - amount);
        this.updateResourceTexts();

        return true;
    }

    public restoreHp(amount: number): number {
        if (amount <= 0 || this.isDead()) {
            return 0;
        }

        const previousHp = this.currentHp;

        this.currentHp = Math.min(this.getMaxHp(), this.currentHp + amount);
        this.updateResourceTexts();

        return this.currentHp - previousHp;
    }

    public restoreMp(amount: number): void {
        if (amount <= 0) {
            return;
        }

        this.currentMp = Math.min(this.getMaxMp(), this.currentMp + amount);
        this.updateResourceTexts();
    }

    public regenerateHp(deltaSeconds: number): void {
        if (!this.isDead() && deltaSeconds > 0) {
            this.restoreHp(this.getHpRegen() * deltaSeconds);
        }
    }

    public regenerateMp(deltaSeconds: number): void {
        if (!this.isDead() && deltaSeconds > 0) {
            this.restoreMp(this.getMpRegen() * deltaSeconds);
        }
    }

    public updateResources(deltaSeconds: number): void {
        if (this.isDead()) {
            return;
        }

        this.regenerateHp(deltaSeconds);
        this.regenerateMp(deltaSeconds);
    }

    private updateResourceTexts(): void {
        this.clampCurrentResources();
        this.hpText.text =
            `HP ${this.formatNumber(this.currentHp)} / ${this.formatNumber(this.getMaxHp())}`;
        this.mpText.text =
            `MP ${this.formatNumber(this.currentMp)} / ${this.formatNumber(this.getMaxMp())}`;
    }

    private formatNumber(value: number): string {
        return value.toFixed(2);
    }

    private clampCurrentResources(): void {
        this.currentHp = Math.min(
            Math.max(this.currentHp, 0),
            this.getMaxHp(),
        );
        this.currentMp = Math.min(
            Math.max(this.currentMp, 0),
            this.getMaxMp(),
        );
    }
}
