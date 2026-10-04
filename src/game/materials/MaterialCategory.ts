export enum MaterialCategory {
    ORE = "ore",
    HERB = "herb",
    MONSTER = "monster",
    ESSENCE = "essence",
    BOSS = "boss",
}

export const MATERIAL_CATEGORY_LABELS: Readonly<
    Record<MaterialCategory, string>
> = {
    [MaterialCategory.ORE]: "Khoáng Thạch",
    [MaterialCategory.HERB]: "Dược Liệu",
    [MaterialCategory.MONSTER]: "Nguyên Liệu Yêu Thú",
    [MaterialCategory.ESSENCE]: "Tinh Hoa",
    [MaterialCategory.BOSS]: "Nguyên Liệu Boss",
};
