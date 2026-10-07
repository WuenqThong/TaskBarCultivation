export interface SkillVisualAssetSet {
    icon: string;
    effectFrames: readonly string[];
    animationSpeed: number;
    scale: number;
}

const frames = (base: string, count: number): string[] =>
    Array.from({ length: count }, (_, index) => `${base}/frame-${String(index + 1).padStart(2, "0")}.png`);

export const SKILL_ASSETS = {
    normalSlash: {
        icon: "/assets/skills/normal-slash/icon/icon.png",
        effectFrames: frames("/assets/skills/normal-slash/slash", 6),
        animationSpeed: 0.24,
        scale: 0.28,
    },
    swordQi: {
        icon: "/assets/skills/sword-qi/icon/icon.png",
        effectFrames: frames("/assets/skills/sword-qi/projectile", 8),
        animationSpeed: 0.18,
        scale: 0.24,
    },
    tenThousandSwords: {
        icon: "/assets/skills/ten-thousand-swords/icon/icon.png",
        effectFrames: frames("/assets/skills/ten-thousand-swords/swords", 8),
        animationSpeed: 0.18,
        scale: 0.48,
    },
    heal: {
        icon: "/assets/skills/heal/icon/icon.png",
        effectFrames: frames("/assets/skills/heal/aura", 8),
        animationSpeed: 0.16,
        scale: 0.38,
    },
    cooldownFrames: frames("/assets/skills/shared/cooldown", 8),
} as const;

export const ALL_SKILL_TEXTURE_PATHS: readonly string[] = [
    SKILL_ASSETS.normalSlash.icon,
    ...SKILL_ASSETS.normalSlash.effectFrames,
    SKILL_ASSETS.swordQi.icon,
    ...SKILL_ASSETS.swordQi.effectFrames,
    SKILL_ASSETS.tenThousandSwords.icon,
    ...SKILL_ASSETS.tenThousandSwords.effectFrames,
    SKILL_ASSETS.heal.icon,
    ...SKILL_ASSETS.heal.effectFrames,
    ...SKILL_ASSETS.cooldownFrames,
];
