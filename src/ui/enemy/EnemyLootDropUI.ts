import { Container, Rectangle, Sprite, Text, Texture } from "pixi.js";
import type { LootResult } from "../../game/loot/LootSystem";
import { getEnemyUiAtlasTexture } from "../../game/enemies/enemyAssets";

const LOOT_GLOW_RECT = new Rectangle(18, 105, 162, 185);

export class EnemyLootDropUI {
    public static create(loot: LootResult): Container {
        const root = new Container({ label: "enemy-loot-drop" });
        const atlas = getEnemyUiAtlasTexture();
        const glow = new Sprite(new Texture({ source: atlas.source, frame: LOOT_GLOW_RECT }));
        glow.anchor.set(0.5);
        glow.scale.set(0.28);
        glow.alpha = 0.75;
        const lines: string[] = [];
        if (loot.spiritStone > 0) lines.push(`+${loot.spiritStone} Linh Thạch`);
        loot.materials.forEach((drop) => lines.push(`+${drop.amount} ${drop.item.name}`));
        loot.catalysts.forEach((drop) => lines.push(`+${drop.amount} ${drop.catalyst.name}`));
        if (loot.artifactFragments.length > 0) {
            const amount = loot.artifactFragments.reduce((sum, drop) => sum + drop.amount, 0);
            lines.push(`+${amount} Mảnh Pháp Bảo`);
        }
        const text = new Text({
            text: lines.slice(0, 3).join("\n"),
            style: { fill: 0xffe7a7, fontSize: 10, fontWeight: "700", align: "center", stroke: { color: 0x070809, width: 2 } },
        });
        text.anchor.set(0.5, 1);
        text.y = -12;
        root.addChild(glow, text);
        return root;
    }
}
