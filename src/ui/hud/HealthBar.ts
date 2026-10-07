import { Container, Graphics, Text } from "pixi.js";
import gsap from "gsap";
import { UITheme } from "../core/UITheme";

export interface ResourceBarOptions {
    width: number;
    height?: number;
    label: string;
    color?: number;
}

export class HealthBar {
    protected readonly container = new Container();
    private readonly fill = new Graphics();
    private readonly valueText: Text;
    private readonly width: number;
    private readonly height: number;
    private readonly color: number;
    private readonly label: string;
    private readonly animatedValue = { ratio: 1 };
    private current = 0;
    private max = 1;

    constructor(options: ResourceBarOptions) {
        this.width = options.width;
        this.height = options.height ?? 14;
        this.color = options.color ?? UITheme.hp;
        this.label = options.label;
        const track = new Graphics()
            .roundRect(0, 0, this.width, this.height, 2)
            .fill({ color: UITheme.ink, alpha: 0.9 })
            .stroke({ color: UITheme.bronze, width: 1 });
        this.valueText = new Text({
            text: "",
            style: { fill: UITheme.text, fontSize: 11, fontWeight: "bold" },
        });
        this.valueText.anchor.set(0.5);
        this.valueText.position.set(this.width / 2, this.height / 2);
        this.container.addChild(track, this.fill, this.valueText);
        this.redraw();
    }

    public getView(): Container {
        return this.container;
    }

    public setValue(current: number, max: number, animate = true): void {
        this.current = Math.max(0, Number.isFinite(current) ? current : 0);
        this.max = Math.max(1, Number.isFinite(max) ? max : 1);
        const target = Math.min(1, this.current / this.max);
        gsap.killTweensOf(this.animatedValue);
        if (!animate) {
            this.animatedValue.ratio = target;
            this.redraw();
            return;
        }
        gsap.to(this.animatedValue, {
            ratio: target,
            duration: 0.22,
            ease: "power2.out",
            onUpdate: () => this.redraw(),
        });
    }

    protected redraw(): void {
        this.fill.clear();
        const fillWidth = Math.floor(this.width * this.animatedValue.ratio);
        if (fillWidth > 0) {
            this.fill
                .roundRect(1, 1, Math.max(0, fillWidth - 2), this.height - 2, 1)
                .fill({ color: this.color, alpha: 0.95 });
        }
        this.valueText.text =
            `${this.label} ${Math.floor(this.current)}/${Math.floor(this.max)}`;
    }
}
