import { Application } from "pixi.js";
import { MainScene } from "../scenes/MainScene.ts";

export class Game {
    private app: Application;
    private mainScene: MainScene | null;

    constructor() {
        this.app = new Application();
        this.mainScene = null;
    }

    public async init(): Promise<void> {
        await this.app.init({
            width: 1280,
            height: 360,
            background: "#18181f",
            antialias: false,
        });

        document.body.appendChild(this.app.canvas);

        this.mainScene = new MainScene(this.app);
        await this.mainScene.init();
    }
}
