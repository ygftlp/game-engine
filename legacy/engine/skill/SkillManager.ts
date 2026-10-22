import { Component } from '../core/Component';
import { Skill, SkillConfig } from './Skill';

export class SkillManager extends Component {
  private readonly skills = new Map<string, Skill>();

  addSkill(config: SkillConfig): Skill {
    const skill = new Skill(config);
    this.skills.set(skill.id, skill);
    return skill;
  }

  removeSkill(skillId: string): void {
    this.skills.delete(skillId);
  }

  getSkill(skillId: string): Skill | null {
    return this.skills.get(skillId) ?? null;
  }

  getSkills(): Skill[] {
    return [...this.skills.values()];
  }

  canCastSkill(skillId: string): boolean {
    return this.skills.get(skillId)?.canCast() ?? false;
  }

  castSkill(skillId: string): boolean {
    return this.skills.get(skillId)?.cast() ?? false;
  }

  resetSkill(skillId: string): void {
    this.skills.get(skillId)?.reset();
  }

  resetAll(): void {
    for (const skill of this.skills.values()) {
      skill.reset();
    }
  }

  onUpdate(dt: number): void {
    for (const skill of this.skills.values()) {
      skill.update(dt);
    }
  }
}
