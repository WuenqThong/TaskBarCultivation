import { Container, Text } from "pixi.js";
import { UITheme } from "../core/UITheme";

export interface PlayerProfileData {
    name: string;
    realm: string;
    stage: string;
    sect?: string;
    title?: string;
}

export class PlayerProfileMini {
    private readonly container = new Container();
    private readonly nameText = this.makeText(15, UITheme.goldBright, true);
    private readonly realmText = this.makeText(13, UITheme.text);
    private readonly detailText = this.makeText(11, UITheme.textMuted);

    constructor() {
        this.realmText.y = 20;
        this.detailText.y = 39;
        this.container.addChild(this.nameText, this.realmText, this.detailText);
    }

    public getView(): Container {
        return this.container;
    }

    public setPlayerProfile(data: PlayerProfileData): void {
        this.nameText.text = data.title
            ? `${data.name} · ${data.title}`
            : data.name;
        this.realmText.text = `${data.realm} · ${data.stage}`;
        this.detailText.text = data.sect ? `Tông môn: ${data.sect}` : "Tán Tu";
    }

    private makeText(size: number, fill: number, bold = false): Text {
        return new Text({
            text: "",
            style: { fill, fontSize: size, fontWeight: bold ? "bold" : "normal" },
        });
    }
}
