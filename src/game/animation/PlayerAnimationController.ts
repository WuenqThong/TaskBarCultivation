import { AnimatedSprite, Assets, Texture } from "pixi.js";

export type PlayerAnimationState = "idle" | "walk" | "run" | "slash" | "spell";

interface AnimationDefinition {
    textures: Texture[];
    speed: number;
    loop: boolean;
    combat: boolean;
}

const HERO_ASSET_PATH = "/assets/hero";

const FRAME_COUNTS: Readonly<Record<Exclude<PlayerAnimationState, "idle">, number>> = {
    walk: 6,
    run: 8,
    slash: 6,
    spell: 6,
};

const ANIMATION_SPEEDS: Readonly<Record<PlayerAnimationState, number>> = {
    idle: 0,
    walk: 0.10,
    run: 0.16,
    slash: 0.34,
    spell: 0.22,
};

function createFramePaths(animation: Exclude<PlayerAnimationState, "idle">): string[] {
    return Array.from({ length: FRAME_COUNTS[animation] }, (_, index) =>
        `${HERO_ASSET_PATH}/${animation}/frame_${index.toString().padStart(3, "0")}.png`,
    );
}

export class PlayerAnimationController {
    private readonly sprite: AnimatedSprite;
    private readonly animations: Readonly<Record<PlayerAnimationState, AnimationDefinition>>;
    private state: PlayerAnimationState = "idle";
    private requestedLocomotion: PlayerAnimationState = "idle";
    private combatLocked = false;

    public static async load(): Promise<Readonly<Record<PlayerAnimationState, Texture[]>>> {
        const [walk, run, slash, spell] = await Promise.all([
            PlayerAnimationController.loadFrames("walk"),
            PlayerAnimationController.loadFrames("run"),
            PlayerAnimationController.loadFrames("slash"),
            PlayerAnimationController.loadFrames("spell"),
        ]);

        return {
            idle: [walk[0]],
            walk,
            run,
            slash,
            spell,
        };
    }

    private static async loadFrames(
        animation: Exclude<PlayerAnimationState, "idle">,
    ): Promise<Texture[]> {
        const textures = await Promise.all(
            createFramePaths(animation).map((path) => Assets.load<Texture>(path)),
        );
        textures.forEach((texture) => {
            texture.source.scaleMode = "nearest";
        });
        return textures;
    }

    constructor(
        sprite: AnimatedSprite,
        textures: Readonly<Record<PlayerAnimationState, Texture[]>>,
    ) {
        this.sprite = sprite;
        this.animations = {
            idle: this.createDefinition(textures.idle, "idle", true, false),
            walk: this.createDefinition(textures.walk, "walk", true, false),
            run: this.createDefinition(textures.run, "run", true, false),
            slash: this.createDefinition(textures.slash, "slash", false, true),
            spell: this.createDefinition(textures.spell, "spell", false, true),
        };
        this.playState("idle", true);
    }

    public getState(): PlayerAnimationState {
        return this.state;
    }

    public isCombatLocked(): boolean {
        return this.combatLocked;
    }

    public idle(): void {
        this.requestLocomotion("idle");
    }

    public walk(): void {
        this.requestLocomotion("walk");
    }

    public run(): void {
        this.requestLocomotion("run");
    }

    public slash(): void {
        this.playCombat("slash");
    }

    public spell(): void {
        this.playCombat("spell");
    }

    private requestLocomotion(state: "idle" | "walk" | "run"): void {
        this.requestedLocomotion = state;
        if (this.combatLocked) {
            return;
        }
        this.playState(state);
    }

    private playCombat(state: "slash" | "spell"): void {
        this.combatLocked = true;
        this.playState(state, true);
        this.sprite.onComplete = () => {
            this.sprite.onComplete = undefined;
            this.combatLocked = false;
            this.playState(this.requestedLocomotion, true);
        };
    }

    private playState(state: PlayerAnimationState, force = false): void {
        if (!force && this.state === state) {
            return;
        }

        const definition = this.animations[state];
        this.state = state;
        this.sprite.stop();
        this.sprite.onComplete = undefined;
        this.sprite.textures = definition.textures;
        this.sprite.loop = definition.loop;
        this.sprite.animationSpeed = definition.speed;
        this.sprite.gotoAndStop(0);

        if (state !== "idle") {
            this.sprite.gotoAndPlay(0);
        }
    }

    private createDefinition(
        textures: Texture[],
        state: PlayerAnimationState,
        loop: boolean,
        combat: boolean,
    ): AnimationDefinition {
        return {
            textures,
            speed: ANIMATION_SPEEDS[state],
            loop,
            combat,
        };
    }
}
