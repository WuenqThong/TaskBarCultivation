export interface StageConfig {
    chapter: number;
    stage: number;

    enemyCount: number;

    enemyHp: number;
    enemyAttack: number;
    enemySpeed: number;

    isBossStage: boolean;
}

export class StageSystem {
    private chapter: number;
    private stage: number;

    constructor() {
        this.chapter = 1;
        this.stage = 1;
    }

    public getChapter(): number {
        return this.chapter;
    }

    public getStage(): number {
        return this.stage;
    }

    public nextStage(): void {
        if (this.stage >= 50) {
            this.chapter += 1;
            this.stage = 1;

            return;
        }

        this.stage += 1;
    }

    public reset(): void {
        this.chapter = 1;
        this.stage = 1;
    }

    public restoreProgress(chapter: number, stage: number): boolean {
        if (
            !Number.isInteger(chapter) ||
            !Number.isInteger(stage) ||
            chapter < 1 ||
            stage < 1 ||
            stage > 50
        ) {
            return false;
        }

        this.chapter = chapter;
        this.stage = stage;
        return true;
    }

    public getConfig(): StageConfig {
        const isBossStage =
            this.stage === 50;

        const chapterDifficulty =
            this.chapter - 1;

        if (isBossStage) {
            return {
                chapter: this.chapter,
                stage: this.stage,

                enemyCount: 1,

                enemyHp:
                    1000 +
                    chapterDifficulty * 1500,

                enemyAttack:
                    30 +
                    chapterDifficulty * 20,

                enemySpeed: 1,

                isBossStage: true,
            };
        }

        return this.getNormalEnemyConfig(this.chapter, this.stage);
    }

    public getNormalEnemyConfig(
        chapter = this.chapter,
        stage = this.stage,
    ): StageConfig {
        const chapterDifficulty = chapter - 1;
        const stageDifficulty = stage - 1;

        const enemyCount =
            3 +
            Math.floor(
                stageDifficulty / 10,
            );

        const enemyHp =
            30 +
            stageDifficulty * 4 +
            chapterDifficulty * 50;

        const enemyAttack =
            4 +
            Math.floor(
                stageDifficulty * 0.4,
            ) +
            chapterDifficulty * 5;

        const enemySpeed =
            1.5 +
            Math.min(
                stageDifficulty * 0.01,
                0.5,
            ) +
            Math.min(
                chapterDifficulty * 0.05,
                0.5,
            );

        return {
            chapter,
            stage,

            enemyCount,

            enemyHp,
            enemyAttack,
            enemySpeed,

            isBossStage: false,
        };
    }
}
