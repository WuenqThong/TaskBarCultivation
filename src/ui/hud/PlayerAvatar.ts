import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import { UI_ASSETS } from "../core/UIAssetRegistry";
import { UITheme } from "../core/UITheme";

export class PlayerAvatar {
    private readonly container = new Container();
    private readonly portrait = new Sprite(Texture.EMPTY);

    constructor() {
        const outer = new Graphics()
            .circle(32, 32, 31)
            .fill({ color: UITheme.bronzeDark })
            .stroke({ color: UITheme.gold, width: 2 });
        const inner = new Graphics()
            .circle(32, 32, 26)
            .fill({ color: UITheme.jadeDark, alpha: 0.7 })
            .stroke({ color: UITheme.jade, width: 1 });
        const badge = new Graphics()
            .circle(55, 55, 7)
            .fill({ color: UITheme.gold })
            .stroke({ color: UITheme.ink, width: 1 });
        this.portrait.anchor.set(0.5);
        this.portrait.position.set(32, 33);
        this.portrait.width = 52;
        this.portrait.height = 52;
        this.container.addChild(outer, inner, this.portrait, badge);
        void Assets.load<Texture>(UI_ASSETS.playerPortrait)
            .then((texture) => {
                texture.source.scaleMode = "nearest";
                this.portrait.texture = texture;
            })
            .catch(() => {
                this.portrait.visible = false;
            });
    }

    public getView(): Container {
        return this.container;
    }
}
