import { Container, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { getEnemyUiAtlasTexture } from "../../game/enemies/enemyAssets";

const FRAME_RECT = new Rectangle(26, 75, 284, 25);
const FILL_RECT = new Rectangle(43, 18, 238, 13);
const WIDTH = 132;

export class EnemyWorldHUD {
    private readonly container = new Container({ label: "enemy-world-hud" });
    private readonly fill: Sprite;
    private readonly hpText: Text;
    private readonly nameText: Text;
    private lastHp = -1;
    private lastMaxHp = -1;

    constructor(name: string, archetypeLabel: string) {
        const atlas = getEnemyUiAtlasTexture();
        const frame = new Sprite(new Texture({ source: atlas.source, frame: FRAME_RECT }));
        this.fill = new Sprite(new Texture({ source: atlas.source, frame: FILL_RECT }));
        frame.width = WIDTH;
        frame.height = 13;
        frame.anchor.set(0.5, 0.5);
        frame.position.set(0, 0);
        frame.roundPixels = true;
        this.fill.anchor.set(0, 0.5);
        this.fill.position.set(-WIDTH / 2 + 8, 0);
        this.fill.height = 6;
        this.fill.width = WIDTH - 16;
        this.fill.roundPixels = true;

        this.nameText = new Text({
            text: `${name} [${archetypeLabel}]`,
            style: { fill: 0xfff4d6, fontSize: 11, fontWeight: "700", stroke: { color: 0x080b0c, width: 2 } },
        });
        this.nameText.anchor.set(0.5, 1);
        this.nameText.y = -10;

        this.hpText = new Text({
            text: "",
            style: { fill: 0xffffff, fontSize: 9, fontWeight: "700", stroke: { color: 0x080b0c, width: 2 } },
        });
        this.hpText.anchor.set(0.5);
        this.hpText.y = 1;
        this.container.addChild(this.fill, frame, this.nameText, this.hpText);
    }

    public getView(): Container {
        return this.container;
    }

    public setHP(current: number, max: number): void {
        if (current === this.lastHp && max === this.lastMaxHp) return;
        this.lastHp = current;
        this.lastMaxHp = max;
        const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
        this.fill.width = Math.round((WIDTH - 16) * ratio);
        this.fill.visible = ratio > 0;
        this.hpText.text = `${Math.ceil(current)} / ${Math.ceil(max)}`;
        this.container.visible = current > 0;
    }

    public setEnraged(enabled: boolean): void {
        this.nameText.style.fill = enabled ? 0xff9a9a : 0xfff4d6;
    }
}
