import type { Container } from "pixi.js";

export interface MenuPanel {
    getView(): Container;
    refresh(): void;
}
