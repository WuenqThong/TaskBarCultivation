import { Container, Graphics, Text } from "pixi.js";
import { UITheme } from "../core/UITheme";

export interface QuickSlotData {
    id?: string;
    name?: string;
    description?: string;
    label?: string;
    icon?: string;
    mpCost?: number;
    cooldown?: number;
    cooldownTotal?: number;
    autoCastEnabled?: boolean;
    insufficientMp?: boolean;
    selected?: boolean;
    locked?: boolean;
    disabled?: boolean;
    onActivate?: () => void;
}

interface SlotView {
    root: Container;
    background: Graphics;
    label: Text;
    cooldown: Text;
    data: QuickSlotData;
}

export class QuickSlotBar {
    private readonly container = new Container();
    private readonly slots: SlotView[] = [];
    private readonly slotSize: number;

    constructor(slotSize = 40, slotCount = 5) {
        this.slotSize = slotSize;
        for (let index = 0; index < slotCount; index += 1) {
            const slot = this.createSlot(index);
            slot.root.x = index * (slotSize + 4);
            this.slots.push(slot);
            this.container.addChild(slot.root);
            this.setQuickSlot(index, { locked: true });
        }
    }

    public getView(): Container {
        return this.container;
    }

    public setQuickSlot(index: number, data: QuickSlotData): void {
        const slot = this.slots[index];
        if (!slot) return;
        slot.data = { ...data };
        slot.label.text = data.locked ? "×" : (data.label ?? `${index + 1}`);
        slot.cooldown.text =
            data.cooldown && data.cooldown > 0 ? data.cooldown.toFixed(1) : "";
        slot.label.alpha = data.disabled ? 0.35 : 1;
        this.redrawSlot(slot, false);
    }

    private createSlot(index: number): SlotView {
        const root = new Container();
        const background = new Graphics();
        const label = new Text({
            text: `${index + 1}`,
            style: {
                fill: UITheme.text,
                fontSize: 14,
                fontWeight: "bold",
                align: "center",
                wordWrap: true,
                wordWrapWidth: this.slotSize - 4,
            },
        });
        const cooldown = new Text({
            text: "",
            style: { fill: 0xffffff, fontSize: 12, fontWeight: "bold" },
        });
        label.anchor.set(0.5);
        label.position.set(this.slotSize / 2, this.slotSize / 2);
        cooldown.anchor.set(0.5);
        cooldown.position.set(this.slotSize / 2, this.slotSize / 2);
        root.eventMode = "static";
        root.cursor = "pointer";
        root.addChild(background, label, cooldown);
        const slot: SlotView = { root, background, label, cooldown, data: {} };
        root.on("pointerover", () => this.redrawSlot(slot, true));
        root.on("pointerout", () => this.redrawSlot(slot, false));
        root.on("pointertap", () => {
            if (!slot.data.locked && !slot.data.disabled) slot.data.onActivate?.();
        });
        return slot;
    }

    private redrawSlot(slot: SlotView, hovered: boolean): void {
        const border =
            slot.data.selected || hovered ? UITheme.jade : UITheme.bronze;
        const fill =
            slot.data.disabled || slot.data.locked
                ? UITheme.bronzeDark
                : UITheme.panelSoft;
        slot.background
            .clear()
            .roundRect(0, 0, this.slotSize, this.slotSize, 3)
            .fill({ color: fill, alpha: 0.96 })
            .stroke({ color: border, width: slot.data.selected ? 2 : 1 });
        const total = Math.max(0, slot.data.cooldownTotal ?? 0);
        const remaining = Math.max(0, slot.data.cooldown ?? 0);
        if (total > 0 && remaining > 0) {
            const ratio = Math.min(1, remaining / total);
            slot.background
                .rect(
                    1,
                    1,
                    this.slotSize - 2,
                    Math.floor((this.slotSize - 2) * ratio),
                )
                .fill({ color: UITheme.ink, alpha: 0.7 });
        }
    }
}
