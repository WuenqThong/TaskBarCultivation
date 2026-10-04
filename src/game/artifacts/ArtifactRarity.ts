export enum ArtifactRarity {
    WHITE = "white",
    GREEN = "green",
    BLUE = "blue",
    PURPLE = "purple",
    GOLD = "gold",
    RED = "red",
}

export const ARTIFACT_RARITY_LABELS: Readonly<
    Record<ArtifactRarity, string>
> = {
    [ArtifactRarity.WHITE]: "Trắng",
    [ArtifactRarity.GREEN]: "Xanh Lục",
    [ArtifactRarity.BLUE]: "Xanh Lam",
    [ArtifactRarity.PURPLE]: "Tím",
    [ArtifactRarity.GOLD]: "Vàng",
    [ArtifactRarity.RED]: "Đỏ",
};

export const ARTIFACT_RARITY_COLORS: Readonly<
    Record<ArtifactRarity, string>
> = {
    [ArtifactRarity.WHITE]: "#FFFFFF",
    [ArtifactRarity.GREEN]: "#4ADE80",
    [ArtifactRarity.BLUE]: "#60A5FA",
    [ArtifactRarity.PURPLE]: "#C084FC",
    [ArtifactRarity.GOLD]: "#FACC15",
    [ArtifactRarity.RED]: "#EF4444",
};
