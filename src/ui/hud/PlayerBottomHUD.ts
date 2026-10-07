import {
    Assets,
    Container,
    Graphics,
    Rectangle,
    Sprite,
    Text,
    Texture,
} from "pixi.js";
import { UI_ASSETS } from "../core/UIAssetRegistry";
import { SKILL_ASSETS } from "../../game/skills/skillAssets";
import type { CurrencyData } from "./CurrencyDisplay";
import type { PlayerProfileData } from "./PlayerProfileMini";
import type { QuickSlotData } from "./QuickSlotBar";

const FRAME_ASSET = "/assets/ui/hud/taskbar/taskbar-frame.png";
const FRAME_CROP = new Rectangle(0, 223, 2172, 265);

const HUD_WIDTH = 1220;
// Keep the supplied frame at its original aspect ratio. Do not squash the art.
const HUD_HEIGHT = Math.round(HUD_WIDTH * FRAME_CROP.height / FRAME_CROP.width);
const GAMEPLAY_VIEW_HEIGHT = 360;
const BOTTOM_MARGIN = 2;

const AVATAR = { x: 47, y: 25, size: 92 };
const PROFILE = { x: 226, y: 15, width: 178 };
const BARS = {
    x: 226,
    width: 176,
    height: 9,
    y: [42, 67, 92] as const,
};
const QUICK = { x: 421, y: 49, size: 42, step: 47 };
const CURRENCY = { spiritX: 700, jadeX: 807, y: 77 };
const NAV = { x: 914, y: 49, size: 42, step: 47 };
const UTILITY = { x: 1129, y: 23, width: 82, height: 108 };

export type HUDMode = "standard" | "compact" | "autoHide";

export interface PlayerBottomHUDOptions {
    onNavigate: (id: string) => void;
    onUtility?: () => void;
}

interface SlotView {
    root: Container;
    icon: Sprite;
    cooldownArt: Sprite;
    label: Text;
    cooldown: Text;
    overlay: Graphics;
    autoCastDot: Graphics;
    data: QuickSlotData;
    hovered: boolean;
}

export class PlayerBottomHUD {
    private readonly container = new Container({ label: "player-bottom-hud" });
    private readonly profileText: Text;
    private readonly hpFill = new Graphics();
    private readonly qiFill = new Graphics();
    private readonly cultivationFill = new Graphics();
    private readonly hpText: Text;
    private readonly qiText: Text;
    private readonly cultivationText: Text;
    private readonly spiritText: Text;
    private readonly jadeText: Text;
    private readonly slots: SlotView[] = [];
    private readonly tooltip = new Container({ label: "skill-tooltip" });
    private readonly tooltipBackground = new Graphics();
    private readonly tooltipText: Text;
    private mode: HUDMode = "standard";
    private screenWidth = 1280;
    private screenHeight = 280;

    public static async loadAssets(): Promise<void> {
        const [frame, portrait] = await Promise.all([
            Assets.load<Texture>(FRAME_ASSET),
            Assets.load<Texture>(UI_ASSETS.playerPortrait),
        ]);
        frame.source.scaleMode = "nearest";
        portrait.source.scaleMode = "nearest";
    }

    constructor(options: PlayerBottomHUDOptions) {
        const source = Assets.get<Texture>(FRAME_ASSET);
        if (!source) {
            throw new Error("HUD frame asset was not loaded before PlayerBottomHUD construction.");
        }
        source.source.scaleMode = "nearest";

        const frameTexture = new Texture({
            source: source.source,
            frame: FRAME_CROP.clone(),
        });
        const frame = new Sprite(frameTexture);
        frame.width = HUD_WIDTH;
        frame.height = HUD_HEIGHT;
        frame.roundPixels = true;
        this.container.addChild(frame);

        this.addAvatar();

        this.profileText = this.makeText(13, 0xf4dfaa, "left");
        this.profileText.position.set(PROFILE.x, PROFILE.y);
        this.container.addChild(this.profileText);

        this.container.addChild(this.hpFill, this.qiFill, this.cultivationFill);

        this.hpText = this.makeText(10, 0xfff2d0, "right");
        this.qiText = this.makeText(10, 0xfff2d0, "right");
        this.cultivationText = this.makeText(10, 0xfff2d0, "right");
        [this.hpText, this.qiText, this.cultivationText].forEach((text, index) => {
            text.anchor.set(1, 0.5);
            text.position.set(BARS.x + BARS.width - 4, BARS.y[index] + BARS.height / 2);
            this.container.addChild(text);
        });

        for (let index = 0; index < 5; index += 1) {
            this.createQuickSlot(index);
        }

        this.tooltipText = this.makeText(11, 0xfff2d0, "left");
        this.tooltipText.style.wordWrap = true;
        this.tooltipText.style.wordWrapWidth = 215;
        this.tooltip.addChild(this.tooltipBackground, this.tooltipText);
        this.tooltip.visible = false;
        this.container.addChild(this.tooltip);

        this.spiritText = this.makeText(13, 0xffdc7b, "center");
        this.jadeText = this.makeText(13, 0x7fffd8, "center");
        this.spiritText.anchor.set(0.5);
        this.jadeText.anchor.set(0.5);
        this.spiritText.position.set(CURRENCY.spiritX, CURRENCY.y);
        this.jadeText.position.set(CURRENCY.jadeX, CURRENCY.y);
        this.container.addChild(this.spiritText, this.jadeText);

        const navItems = [
            ["character", "NHÂN"],
            ["inventory", "TÚI"],
            ["cultivation", "TU"],
            ["techniques", "PHÁP"],
        ] as const;
        navItems.forEach(([id, label], index) => {
            const x = NAV.x + index * NAV.step;
            const text = this.makeText(10, 0xffe8ae, "center");
            text.text = label;
            text.anchor.set(0.5);
            text.position.set(x + NAV.size / 2, NAV.y + NAV.size / 2);
            this.container.addChild(text);
            this.addHitArea(x, NAV.y, NAV.size, NAV.size, () => options.onNavigate(id));
        });

        this.addHitArea(
            UTILITY.x,
            UTILITY.y,
            UTILITY.width,
            UTILITY.height,
            () => options.onUtility?.(),
        );

        this.container.eventMode = "static";
        this.container.hitArea = new Rectangle(0, 0, HUD_WIDTH, HUD_HEIGHT);
    }

    public getView(): Container {
        return this.container;
    }

    public setPlayerProfile(data: PlayerProfileData): void {
        this.profileText.text = `${data.name}  ·  ${data.realm}\n${data.stage}`;
    }

    public setHP(current: number, max: number, _animate = true): void {
        this.drawBar(this.hpFill, BARS.y[0], current, max, 0xc94747);
        this.hpText.text = `HP ${Math.ceil(current)} / ${Math.ceil(max)}`;
    }

    public setQi(current: number, max: number, _animate = true): void {
        this.drawBar(this.qiFill, BARS.y[1], current, max, 0x4aa9d8);
        this.qiText.text = `KHÍ ${Math.ceil(current)} / ${Math.ceil(max)}`;
    }

    public setCultivation(current: number, max: number, _animate = true): void {
        this.drawBar(this.cultivationFill, BARS.y[2], current, max, 0x63c98a);
        this.cultivationText.text = `TU ${Math.floor(current)} / ${Math.floor(max)}`;
    }

    public setCurrencies(data: CurrencyData): void {
        this.spiritText.text = this.formatNumber(data.spiritStones);
        this.jadeText.text = this.formatNumber(data.jade);
    }

    public setQuickSlot(index: number, data: QuickSlotData): void {
        const slot = this.slots[index];
        if (!slot) return;
        slot.data = { ...data };
        slot.overlay.clear();
        slot.cooldownArt.visible = false;
        slot.autoCastDot.clear();
        const iconTexture = data.icon ? Assets.get<Texture>(data.icon) : null;
        if (iconTexture) {
            iconTexture.source.scaleMode = "nearest";
            slot.icon.texture = iconTexture;
            slot.icon.visible = !data.locked;
            slot.icon.alpha = data.insufficientMp ? 0.34 : (data.disabled ? 0.38 : 1);
        } else {
            slot.icon.visible = false;
        }
        slot.label.text = data.locked ? "×" : (data.label ?? String(index + 1));
        slot.label.alpha = data.disabled ? 0.35 : 1;
        slot.cooldown.text = "";
        const total = Math.max(0, data.cooldownTotal ?? 0);
        const remaining = Math.max(0, data.cooldown ?? 0);

        if (data.locked) {
            slot.overlay
                .rect(2, 2, QUICK.size - 4, QUICK.size - 4)
                .fill({ color: 0x071011, alpha: 0.58 });
        } else if (data.insufficientMp && remaining <= 0) {
            slot.overlay
                .rect(2, 2, QUICK.size - 4, QUICK.size - 4)
                .fill({ color: 0x421c25, alpha: 0.48 });
        }

        if (!data.locked && data.autoCastEnabled) {
            slot.autoCastDot
                .circle(6, 6, 3)
                .fill({ color: 0x65e6b3, alpha: 1 })
                .stroke({ color: 0x071011, width: 1 });
        }

        if (total > 0 && remaining > 0) {
            const ratio = Math.min(1, remaining / total);
            const frameIndex = Math.min(
                SKILL_ASSETS.cooldownFrames.length - 1,
                Math.floor((1 - ratio) * SKILL_ASSETS.cooldownFrames.length),
            );
            const cooldownTexture = Assets.get<Texture>(SKILL_ASSETS.cooldownFrames[frameIndex]);
            if (cooldownTexture) {
                cooldownTexture.source.scaleMode = "nearest";
                slot.cooldownArt.texture = cooldownTexture;
                slot.cooldownArt.visible = true;
            }
            slot.cooldown.text = Math.ceil(remaining).toString();
        }

        if (slot.hovered) this.showTooltip(index, slot.data);
    }

    public setHUDMode(mode: HUDMode): void {
        this.mode = mode;
        this.layout(this.screenWidth, this.screenHeight);
    }

    public layout(screenWidth: number, screenHeight: number): void {
        this.screenWidth = Math.max(1, screenWidth);
        this.screenHeight = Math.max(1, screenHeight);

        const fitScale = Math.min(1, (this.screenWidth - 16) / HUD_WIDTH);
        const modeScale = this.mode === "compact" ? 0.82 : 1;
        const scale = fitScale * modeScale;
        // BottomMenu expands the renderer below the gameplay strip.
        // Keep the HUD anchored to the gameplay strip instead of letting it
        // drift down into the expanded menu area.
        const gameplayHeight = Math.min(this.screenHeight, GAMEPLAY_VIEW_HEIGHT);
        this.container.scale.set(scale);
        this.container.x = Math.round((this.screenWidth - HUD_WIDTH * scale) / 2);
        this.container.y = Math.round(gameplayHeight - HUD_HEIGHT * scale - BOTTOM_MARGIN);
        this.container.visible = this.mode !== "autoHide";
    }

    private addAvatar(): void {
        const texture = Assets.get<Texture>(UI_ASSETS.playerPortrait);
        if (!texture) return;
        texture.source.scaleMode = "nearest";
        const portrait = new Sprite(texture);
        portrait.anchor.set(0.5);
        portrait.position.set(
            AVATAR.x + AVATAR.size / 2,
            AVATAR.y + AVATAR.size / 2 + 6,
        );
        portrait.scale.set(2.15);
        portrait.roundPixels = true;
        const mask = new Graphics()
            .circle(
                AVATAR.x + AVATAR.size / 2,
                AVATAR.y + AVATAR.size / 2,
                AVATAR.size * 0.41,
            )
            .fill(0xffffff);
        portrait.mask = mask;
        this.container.addChild(portrait, mask);
    }

    private createQuickSlot(index: number): void {
        const root = new Container();
        root.position.set(QUICK.x + index * QUICK.step, QUICK.y);
        const icon = new Sprite(Texture.EMPTY);
        icon.position.set(4, 4);
        icon.width = QUICK.size - 8;
        icon.height = QUICK.size - 8;
        icon.roundPixels = true;
        icon.visible = false;
        const cooldownArt = new Sprite(Texture.EMPTY);
        cooldownArt.width = QUICK.size;
        cooldownArt.height = QUICK.size;
        cooldownArt.alpha = 0.78;
        cooldownArt.roundPixels = true;
        cooldownArt.visible = false;
        const overlay = new Graphics();
        const autoCastDot = new Graphics();
        const label = this.makeText(9, 0xffe5a0, "right");
        const cooldown = this.makeText(12, 0xffffff, "center");
        label.anchor.set(1, 1);
        cooldown.anchor.set(0.5);
        label.position.set(QUICK.size - 3, QUICK.size - 2);
        cooldown.position.set(QUICK.size / 2, QUICK.size / 2);
        root.addChild(icon, cooldownArt, overlay, autoCastDot, label, cooldown);
        const slot: SlotView = {
            root,
            icon,
            cooldownArt,
            label,
            cooldown,
            overlay,
            autoCastDot,
            data: {},
            hovered: false,
        };
        root.eventMode = "static";
        root.cursor = "pointer";
        root.hitArea = new Rectangle(0, 0, QUICK.size, QUICK.size);
        root.on("pointerover", () => {
            slot.hovered = true;
            this.showTooltip(index, slot.data);
        });
        root.on("pointerout", () => {
            slot.hovered = false;
            this.tooltip.visible = false;
        });
        root.on("pointertap", () => {
            if (!slot.data.locked && !slot.data.disabled) slot.data.onActivate?.();
        });
        this.slots.push(slot);
        this.container.addChild(root);
    }

    private showTooltip(index: number, data: QuickSlotData): void {
        const name = data.locked ? "Ô kỹ năng khóa" : (data.name ?? `Kỹ năng ${index + 1}`);
        const lines = [name];
        if (data.description) lines.push(data.description);
        if (!data.locked) {
            lines.push(`Khí: ${Math.max(0, data.mpCost ?? 0)}`);
            if ((data.cooldownTotal ?? 0) > 0) {
                lines.push(`Hồi chiêu: ${(data.cooldownTotal ?? 0).toFixed(1)}s`);
            }
            if (data.insufficientMp) lines.push("Không đủ Khí");
            lines.push(`Tự động: ${data.autoCastEnabled ? "BẬT" : "TẮT"}`);
        } else {
            lines.push("Dành cho kỹ năng tương lai");
        }

        this.tooltipText.text = lines.join("\n");
        const padding = 8;
        const width = 231;
        const height = Math.ceil(this.tooltipText.height + padding * 2);
        this.tooltipBackground
            .clear()
            .roundRect(0, 0, width, height, 4)
            .fill({ color: 0x071011, alpha: 0.96 })
            .stroke({ color: 0xc8973e, width: 1 });
        this.tooltipText.position.set(padding, padding);
        const slotX = QUICK.x + index * QUICK.step;
        this.tooltip.position.set(
            Math.round(Math.min(HUD_WIDTH - width - 8, Math.max(8, slotX - width / 2 + QUICK.size / 2))),
            Math.round(QUICK.y - height - 8),
        );
        this.tooltip.visible = true;
    }

    private addHitArea(
        x: number,
        y: number,
        width: number,
        height: number,
        action: () => void,
    ): void {
        const hit = new Container();
        hit.position.set(x, y);
        hit.eventMode = "static";
        hit.cursor = "pointer";
        hit.hitArea = new Rectangle(0, 0, width, height);
        hit.on("pointertap", action);
        this.container.addChild(hit);
    }

    private drawBar(
        graphics: Graphics,
        y: number,
        current: number,
        max: number,
        color: number,
    ): void {
        const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
        graphics.clear();
        if (ratio <= 0) return;
        graphics
            .rect(BARS.x + 3, y + 2, Math.round((BARS.width - 6) * ratio), BARS.height - 4)
            .fill({ color, alpha: 0.9 });
    }

    private makeText(fontSize: number, fill: number, align: "left" | "center" | "right"): Text {
        return new Text({
            text: "",
            style: {
                fill,
                fontSize,
                fontWeight: "700",
                align,
                stroke: { color: 0x071011, width: 2 },
            },
        });
    }

    private formatNumber(value: number): string {
        const normalized = Math.max(0, Math.floor(value));
        if (normalized >= 1_000_000) return `${(normalized / 1_000_000).toFixed(1)}m`;
        if (normalized >= 1_000) return `${(normalized / 1_000).toFixed(1)}k`;
        return normalized.toString();
    }
}
