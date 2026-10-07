import gsap from "gsap";
import {
    AnimatedSprite,
    Assets,
    Container,
    Graphics,
    Texture,
} from "pixi.js";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import { ALL_SKILL_TEXTURE_PATHS, SKILL_ASSETS } from "./skillAssets";

export interface SkillVfxCallbacks {
    onHit?: () => void;
    onComplete?: () => void;
}

export class SkillVfxSystem {
    private readonly world: Container;
    private readonly player: Player;
    private readonly debug: boolean;
    private readonly activeTweens = new Set<gsap.core.Tween>();

    public static async loadAssets(): Promise<void> {
        const textures = await Promise.all(
            ALL_SKILL_TEXTURE_PATHS.map((path) => Assets.load<Texture>(path)),
        );
        textures.forEach((texture) => {
            texture.source.scaleMode = "nearest";
        });
    }

    constructor(world: Container, player: Player, debug = false) {
        this.world = world;
        this.player = player;
        this.debug = debug;
    }

    public playNormalSlash(target: Enemy, callbacks: SkillVfxCallbacks): void {
        const sprite = this.createEffect(
            SKILL_ASSETS.normalSlash.effectFrames,
            SKILL_ASSETS.normalSlash.animationSpeed,
            SKILL_ASSETS.normalSlash.scale,
        );
        const px = this.player.getView().x;
        const py = this.player.getView().y;
        sprite.scale.x *= this.player.getFacingDirection();
        sprite.position.set(Math.round((px + target.getX()) / 2), Math.round(py - 4));
        let hit = false;
        sprite.onFrameChange = (frame) => {
            if (!hit && frame >= 2) {
                hit = true;
                callbacks.onHit?.();
            }
        };
        this.attachDebugCircle(sprite, 48);
        this.finishOnComplete(sprite, callbacks.onComplete);
    }

    public playSwordQi(target: Enemy, callbacks: SkillVfxCallbacks): void {
        const sprite = this.createEffect(
            SKILL_ASSETS.swordQi.effectFrames,
            SKILL_ASSETS.swordQi.animationSpeed,
            SKILL_ASSETS.swordQi.scale,
            true,
        );
        const direction = this.player.getFacingDirection();
        sprite.scale.x *= direction;
        const startX = Math.round(this.player.getView().x + 42 * direction);
        const startY = Math.round(this.player.getView().y - 8);
        sprite.position.set(startX, startY);
        this.attachDebugCircle(sprite, 24);
        const tween = gsap.to(sprite, {
            x: Math.round(target.getX()),
            y: Math.round(target.getView().y - 8),
            duration: 0.42,
            ease: "none",
            onUpdate: () => {
                sprite.x = Math.round(sprite.x);
                sprite.y = Math.round(sprite.y);
            },
            onComplete: () => {
                this.activeTweens.delete(tween);
                callbacks.onHit?.();
                this.destroyEffect(sprite);
                callbacks.onComplete?.();
            },
        });
        this.activeTweens.add(tween);
    }

    public playTenThousandSwords(
        targets: readonly Enemy[],
        callbacks: SkillVfxCallbacks,
    ): void {
        const living = targets.filter((enemy) => !enemy.isDead());
        if (living.length === 0) {
            callbacks.onComplete?.();
            return;
        }
        const sprite = this.createEffect(
            SKILL_ASSETS.tenThousandSwords.effectFrames,
            SKILL_ASSETS.tenThousandSwords.animationSpeed,
            SKILL_ASSETS.tenThousandSwords.scale,
        );
        const centerX = living.reduce((sum, enemy) => sum + enemy.getX(), 0) / living.length;
        const centerY = living.reduce((sum, enemy) => sum + enemy.getView().y, 0) / living.length;
        sprite.position.set(Math.round(centerX), Math.round(centerY - 22));
        let hit = false;
        sprite.onFrameChange = (frame) => {
            if (!hit && frame >= 4) {
                hit = true;
                callbacks.onHit?.();
            }
        };
        this.attachDebugCircle(sprite, 110);
        this.finishOnComplete(sprite, callbacks.onComplete);
    }

    public playHeal(callbacks: SkillVfxCallbacks): void {
        const sprite = this.createEffect(
            SKILL_ASSETS.heal.effectFrames,
            SKILL_ASSETS.heal.animationSpeed,
            SKILL_ASSETS.heal.scale,
        );
        sprite.position.set(
            Math.round(this.player.getView().x),
            Math.round(this.player.getView().y - 15),
        );
        let healed = false;
        sprite.onFrameChange = (frame) => {
            if (!healed && frame >= 3) {
                healed = true;
                callbacks.onHit?.();
            }
        };
        this.attachDebugCircle(sprite, 72);
        this.finishOnComplete(sprite, callbacks.onComplete);
    }

    public destroy(): void {
        this.activeTweens.forEach((tween) => tween.kill());
        this.activeTweens.clear();
    }

    private createEffect(
        paths: readonly string[],
        speed: number,
        scale: number,
        loop = false,
    ): AnimatedSprite {
        const textures = paths.map((path) => {
            const texture = Assets.get<Texture>(path);
            if (!texture) throw new Error(`Missing preloaded skill texture: ${path}`);
            texture.source.scaleMode = "nearest";
            return texture;
        });
        const sprite = new AnimatedSprite(textures);
        sprite.anchor.set(0.5);
        sprite.scale.set(scale);
        sprite.animationSpeed = speed;
        sprite.loop = loop;
        sprite.roundPixels = true;
        sprite.eventMode = "none";
        this.world.addChild(sprite);
        sprite.gotoAndPlay(0);
        return sprite;
    }

    private finishOnComplete(sprite: AnimatedSprite, onComplete?: () => void): void {
        sprite.loop = false;
        sprite.onComplete = () => {
            this.destroyEffect(sprite);
            onComplete?.();
        };
    }

    private destroyEffect(sprite: AnimatedSprite): void {
        sprite.stop();
        sprite.onComplete = undefined;
        sprite.onFrameChange = undefined;
        sprite.removeFromParent();
        sprite.destroy({ children: true });
    }

    private attachDebugCircle(sprite: AnimatedSprite, radius: number): void {
        if (!this.debug) return;
        const debug = new Graphics()
            .circle(0, 0, radius)
            .stroke({ color: 0xff33ff, width: 1, alpha: 0.7 });
        debug.eventMode = "none";
        sprite.addChild(debug);
    }
}
