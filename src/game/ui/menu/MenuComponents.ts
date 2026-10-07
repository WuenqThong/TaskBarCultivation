import { Container, Graphics, Text } from "pixi.js";
import { MENU_COLORS, MENU_FONT } from "./MenuTheme";

export function createMenuText(
    value: string,
    fontSize: number = MENU_FONT.body,
    color: number = MENU_COLORS.text,
): Text {
    return new Text({
        text: value,
        style: {
            fill: color,
            fontSize,
            fontWeight: "bold",
        },
    });
}

export function createMenuActionButton(
    label: string,
    width: number,
    height: number,
    action: () => void,
    textColor: number = MENU_COLORS.text,
    fontSize: number = MENU_FONT.tab,
): Container {
    const button = new Container();
    const background = new Graphics();
    const text = createMenuText(label, fontSize, textColor);

    const draw = (hovered: boolean): void => {
        background
            .clear()
            .roundRect(0, 0, width, height, 4)
            .fill({
                color: hovered ? MENU_COLORS.panelAlt : MENU_COLORS.panel,
                alpha: 0.98,
            })
            .stroke({
                color: hovered ? MENU_COLORS.bronzeBright : MENU_COLORS.bronze,
                width: hovered ? 2 : 1,
            });
    };

    button.eventMode = "static";
    button.cursor = "pointer";
    text.anchor.set(0.5);
    text.position.set(Math.round(width / 2), Math.round(height / 2));
    button.addChild(background, text);
    draw(false);
    button.on("pointerover", () => draw(true));
    button.on("pointerout", () => draw(false));
    button.on("pointertap", action);

    return button;
}

export function drawMenuPanelBackground(
    graphics: Graphics,
    width: number,
    height: number,
): void {
    graphics
        .clear()
        .rect(0, 0, width, height)
        .fill({ color: MENU_COLORS.background, alpha: 0.985 })
        .rect(6, 6, width - 12, height - 12)
        .stroke({ color: MENU_COLORS.bronzeDark, width: 2 })
        .rect(9, 9, width - 18, height - 18)
        .stroke({ color: MENU_COLORS.jade, width: 1, alpha: 0.55 });
}
