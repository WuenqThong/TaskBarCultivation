import type { EnemyDefinition } from "../enemies/EnemyDefinition";
import type { BossPhaseDefinition } from "./BossPhase";
import type { BossSkillDefinition } from "./BossSkill";

export interface BossDefinition {
    enemy: EnemyDefinition & { isBoss: true };
    phases: ReadonlyArray<BossPhaseDefinition>;
    skills: ReadonlyArray<BossSkillDefinition>;
    minimumSkillGap: number;
}
