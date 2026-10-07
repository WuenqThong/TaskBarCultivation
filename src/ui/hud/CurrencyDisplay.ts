import { Container, Graphics, Text } from "pixi.js";
import { UITheme } from "../core/UITheme";

export interface CurrencyData {
    spiritStones: number;
    jade: number;
}

export class CurrencyDisplay {
    private readonly container = new Container();
    private readonly spiritText = this.makeText(UITheme.goldBright);
    private readonly jadeText = this.makeText(UITheme.jade);

    constructor() {
        const background = new Graphics()
            .roundRect(0, 0, 132, 58, 4)
            .fill({ color: UITheme.ink, alpha: 0.62 })
            .stroke({ color: UITheme.bronze, width: 1 });
        this.spiritText.position.set(12, 9);
        this.jadeText.position.set(12, 33);
        this.container.addChild(background, this.spiritText, this.jadeText);
    }

    public getView(): Container {
        return this.container;
    }

    public setCurrencies(data: CurrencyData): void {
        this.spiritText.text = `◆ ${this.format(data.spiritStones)}`;
        this.jadeText.text = `◇ ${this.format(data.jade)}`;
    }

    private makeText(fill: number): Text {
        return new Text({
            text: "",
            style: { fill, fontSize: 13, fontWeight: "bold" },
        });
    }

    private format(value: number): string {
        const normalized = Math.max(0, Math.floor(value));
        if (normalized >= 1_000_000) return `${(normalized / 1_000_000).toFixed(1)}m`;
        if (normalized >= 1_000) return `${(normalized / 1_000).toFixed(1)}k`;
        return normalized.toString();
    }
}
