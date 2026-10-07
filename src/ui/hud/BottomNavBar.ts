import { Container, Graphics, Text } from "pixi.js";
import { UITheme } from "../core/UITheme";

interface BottomNavItem {
    id: string;
    label: string;
    disabled?: boolean;
}

const NAV_ITEMS: ReadonlyArray<BottomNavItem> = [
    { id: "character", label: "NHÂN" },
    { id: "inventory", label: "TÚI" },
    { id: "cultivation", label: "TU" },
    { id: "techniques", label: "PHÁP" },
];

export class BottomNavBar {
    private readonly container = new Container();

    constructor(onNavigate: (id: string) => void) {
        NAV_ITEMS.forEach((item, index) => {
            const button = this.createButton(item, () => onNavigate(item.id));
            button.x = index * 59;
            this.container.addChild(button);
        });
    }

    public getView(): Container {
        return this.container;
    }

    private createButton(item: BottomNavItem, action: () => void): Container {
        const root = new Container();
        const background = new Graphics()
            .roundRect(0, 0, 54, 44, 3)
            .fill({
                color: item.disabled ? UITheme.bronzeDark : UITheme.panelSoft,
                alpha: 0.96,
            })
            .stroke({
                color: item.disabled ? UITheme.disabled : UITheme.bronze,
                width: 1,
            });
        const label = new Text({
            text: item.label,
            style: {
                fill: item.disabled ? UITheme.disabled : UITheme.text,
                fontSize: 11,
                fontWeight: "bold",
            },
        });
        label.anchor.set(0.5);
        label.position.set(27, 22);
        root.addChild(background, label);
        if (!item.disabled) {
            root.eventMode = "static";
            root.cursor = "pointer";
            root.on("pointertap", action);
            root.on("pointerover", () => {
                background.tint = UITheme.jade;
            });
            root.on("pointerout", () => {
                background.tint = 0xffffff;
            });
        }
        return root;
    }
}
