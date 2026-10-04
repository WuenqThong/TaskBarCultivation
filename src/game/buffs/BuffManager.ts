import type { PlayerStatSystem } from "../stats/PlayerStatSystem";
import type { ActiveBuff, BuffModifierInput } from "./Buff";

export class BuffManager {
    private statSystem: PlayerStatSystem;
    private activeBuffs: Map<string, ActiveBuff>;
    private sequence: number;
    private version: number;

    constructor(statSystem: PlayerStatSystem) {
        this.statSystem = statSystem;
        this.activeBuffs = new Map();
        this.sequence = 0;
        this.version = 0;
    }

    public addBuff(
        sourceId: string,
        modifiers: ReadonlyArray<BuffModifierInput>,
        duration: number,
    ): ActiveBuff | null {
        if (duration <= 0 || modifiers.length === 0) {
            return null;
        }

        this.removeBuffBySource(sourceId);
        this.sequence += 1;
        const id = `buff:${sourceId}:${this.sequence}`;
        const activeBuff: ActiveBuff = {
            id,
            sourceId,
            remainingDuration: duration,
            modifiers: modifiers.map((modifier, index) => ({
                ...modifier,
                id: `${id}:${index}`,
                source: id,
            })),
        };

        for (const modifier of activeBuff.modifiers) {
            this.statSystem.addModifier(modifier);
        }

        this.activeBuffs.set(sourceId, activeBuff);
        this.version += 1;
        return this.cloneBuff(activeBuff);
    }

    public removeBuff(sourceId: string): boolean {
        return this.removeBuffBySource(sourceId);
    }

    public update(deltaSeconds: number): void {
        if (deltaSeconds <= 0) {
            return;
        }

        const expiredSources: string[] = [];

        for (const buff of this.activeBuffs.values()) {
            buff.remainingDuration = Math.max(
                0,
                buff.remainingDuration - deltaSeconds,
            );

            if (buff.remainingDuration <= 0) {
                expiredSources.push(buff.sourceId);
            }
        }

        for (const sourceId of expiredSources) {
            this.removeBuffBySource(sourceId);
        }
    }

    public hasBuff(sourceId: string): boolean {
        return this.activeBuffs.has(sourceId);
    }

    public getActiveBuffs(): ActiveBuff[] {
        return Array.from(
            this.activeBuffs.values(),
            (buff) => this.cloneBuff(buff),
        );
    }

    public getVersion(): number {
        return this.version;
    }

    public clear(): void {
        if (this.activeBuffs.size === 0) {
            return;
        }

        for (const buff of this.activeBuffs.values()) {
            for (const modifier of buff.modifiers) {
                this.statSystem.removeModifier(modifier.id);
            }
        }

        this.activeBuffs.clear();
        this.version += 1;
    }

    private removeBuffBySource(sourceId: string): boolean {
        const buff = this.activeBuffs.get(sourceId);

        if (!buff) {
            return false;
        }

        for (const modifier of buff.modifiers) {
            this.statSystem.removeModifier(modifier.id);
        }

        this.activeBuffs.delete(sourceId);
        this.version += 1;
        return true;
    }

    private cloneBuff(buff: ActiveBuff): ActiveBuff {
        return {
            ...buff,
            modifiers: buff.modifiers.map((modifier) => ({ ...modifier })),
        };
    }
}
