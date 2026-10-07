import { HealthBar } from "./HealthBar";
import { UITheme } from "../core/UITheme";

export class CultivationBar extends HealthBar {
    constructor(width: number) {
        super({ width, height: 14, label: "TU", color: UITheme.cultivation });
    }
}
