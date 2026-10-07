import { Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { getEnemyUiAtlasTexture } from "../../game/enemies/enemyAssets";

const BOSS_PORTRAIT_RECT = new Rectangle(816, 107, 145, 112);
const BOSS_BAR_RECT = new Rectangle(942, 151, 472, 45);

export class BossHUD {
    private readonly container = new Container({ label: "boss-hud" });
    private readonly hpFill = new Graphics();
    private readonly title: Text;
    private readonly phaseText: Text;
    private readonly statusText: Text;
    private readonly phaseMarkers: Graphics[] = [];

    constructor() {
        const atlas = getEnemyUiAtlasTexture();
        const portrait = new Sprite(new Texture({ source: atlas.source, frame: BOSS_PORTRAIT_RECT }));
        portrait.width = 118;
        portrait.height = 91;
        portrait.roundPixels = true;
        const barFrame = new Sprite(new Texture({ source: atlas.source, frame: BOSS_BAR_RECT }));
        barFrame.position.set(96, 30);
        barFrame.width = 424;
        barFrame.height = 40;
        barFrame.roundPixels = true;
        this.title = this.makeText(16, 0xffefc0);
        this.title.anchor.set(0.5, 0);
        this.title.position.set(310, 6);
        this.phaseText = this.makeText(11, 0x8fffe0);
        this.phaseText.anchor.set(0.5, 0);
        this.phaseText.position.set(310, 72);
        this.statusText = this.makeText(10, 0xffd782);
        this.statusText.anchor.set(0.5, 0);
        this.statusText.position.set(310, 86);
        this.hpFill.position.set(123, 44);
        this.container.addChild(portrait, this.hpFill, barFrame, this.title, this.phaseText, this.statusText);
        for (let index = 0; index < 3; index += 1) {
            const marker = new Graphics();
            marker.position.set(261 + index * 49, 62);
            this.phaseMarkers.push(marker);
            this.container.addChild(marker);
        }
        this.container.visible = false;
    }

    public getView(): Container { return this.container; }

    public layout(screenWidth: number): void {
        this.container.x = Math.round((screenWidth - 540) / 2);
        this.container.y = 8;
    }

    public show(name: string, current: number, max: number, phaseIndex: number, buffSeconds: number): void {
        this.container.visible = true;
        const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
        this.hpFill.clear();
        this.hpFill.rect(0, 0, Math.round(362 * ratio), 10).fill({ color: 0xd92727, alpha: 0.95 });
        this.title.text = `${name}  ${Math.ceil(current)} / ${Math.ceil(max)}`;
        this.phaseText.text = `Giai đoạn ${phaseIndex + 1} / 3`;
        this.statusText.text = buffSeconds > 0 ? `Lang Vương Hống · ${buffSeconds.toFixed(1)}s` : "";
        this.phaseMarkers.forEach((marker, index) => {
            marker.clear().circle(0, 0, 6).fill({ color: index <= phaseIndex ? 0x64e6bd : 0x233736, alpha: 1 })
                .stroke({ color: 0xd5a44a, width: 1 });
        });
    }

    public hide(): void { this.container.visible = false; }

    private makeText(fontSize: number, fill: number): Text {
        return new Text({ text: "", style: { fill, fontSize, fontWeight: "700", stroke: { color: 0x050809, width: 2 } } });
    }
}
