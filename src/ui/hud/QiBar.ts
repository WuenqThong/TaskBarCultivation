import { HealthBar } from "./HealthBar";
import { UITheme } from "../core/UITheme";

export class QiBar extends HealthBar {
    constructor(width: number) {
        super({ width, height: 14, label: "QI", color: UITheme.qi });
    }
}
