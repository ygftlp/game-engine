// 技能系统Demo场景：展示技能冷却、施放、效果
import { 
  Scene, Node, SkillManager
} from '../../../engine';

// 技能状态枚举
const enum SkillState {
  Ready = 'ready',
  Cooldown = 'cooldown',
}

// 技能Demo场景
export class SkillDemoScene extends Scene {
  private player!: Node;
  private skillManager!: SkillManager;
  private enemies: Node[] = [];
  private score = 0;

  onEnter(): void {
    const w = 400;
    const h = 667;

    // 创建玩家
    this.player = new Node();
    this.player.x = w / 2;
    this.player.y = h * 0.7;
    this.player.width = 50;
    this.player.height = 50;
    this.addChild(this.player);

    // 添加技能管理器
    this.skillManager = new SkillManager();
    this.player.addComponent(this.skillManager);

    // 添加技能
    this.skillManager.addSkill({
      id: 'meleeAttack',
      name: '近战攻击',
      description: '对目标造成物理伤害',
      cooldown: 1.0,
      cost: 0,
      range: 80,
      damage: 20,
      duration: 0,
      castTime: 0.2,
      effects: [{ type: 'damage', value: 20, target: 'enemy' }],
    });

    this.skillManager.addSkill({
      id: 'fireball',
      name: '火球术',
      description: '发射火球造成范围伤害',
      cooldown: 3.0,
      cost: 15,
      range: 200,
      damage: 30,
      duration: 0,
      castTime: 0.5,
      effects: [{ type: 'aoe', value: 30, radius: 60, target: 'area' }],
    });

    this.skillManager.addSkill({
      id: 'heal',
      name: '治疗',
      description: '恢复生命值',
      cooldown: 5.0,
      cost: 20,
      range: 0,
      damage: 0,
      duration: 0,
      castTime: 0.8,
      effects: [{ type: 'heal', value: 50, target: 'self' }],
    });

    // 生成敌人
    this.spawnEnemies();
  }

  private spawnEnemies(): void {
    for (let i = 0; i < 5; i++) {
      const enemy = new Node();
      enemy.x = 50 + Math.random() * 300;
      enemy.y = 100 + Math.random() * 200;
      enemy.width = 40;
      enemy.height = 40;
      (enemy as any).hp = 50;
      this.addChild(enemy);
      this.enemies.push(enemy);
    }
  }

  private checkMeleeHit(): void {
    const attackRange = 80;
    for (const enemy of this.enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= attackRange) {
        (enemy as any).hp -= 20;
        if ((enemy as any).hp <= 0) {
          enemy.removeFromParent();
          this.enemies = this.enemies.filter(e => e !== enemy);
          this.score += 10;
        }
      }
    }
  }

  private spawnFireball(): void {
    // 创建火球节点
    const fireball = new Node();
    fireball.x = this.player.x;
    fireball.y = this.player.y;
    fireball.width = 20;
    fireball.height = 20;
    this.addChild(fireball);

    // 火球移动逻辑
    let lifeTime = 0;
    const updateFireball = () => {
      lifeTime += 1/60;
      fireball.y -= 200 * (1/60);

      // 检测碰撞
      for (const enemy of this.enemies) {
        const dx = enemy.x - fireball.x;
        const dy = enemy.y - fireball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
          // AOE伤害
          for (const e of this.enemies) {
            const edx = e.x - fireball.x;
            const edy = e.y - fireball.y;
            const edist = Math.sqrt(edx * edx + edy * edy);
            if (edist < 60) {
              (e as any).hp -= 30;
              if ((e as any).hp <= 0) {
                e.removeFromParent();
                this.enemies = this.enemies.filter(en => en !== e);
                this.score += 10;
              }
            }
          }
          fireball.removeFromParent();
          return;
        }
      }

      // 超出范围销毁
      if (lifeTime > 2 || fireball.y < -50) {
        fireball.removeFromParent();
        return;
      }

      setTimeout(updateFireball, 1000/60);
    };

    setTimeout(updateFireball, 1000/60);
  }

  update(dt: number): void {
    super.update(dt);

    // 敌人AI
    for (const enemy of this.enemies) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 50) {
        enemy.x += (dx / dist) * 50 * dt;
        enemy.y += (dy / dist) * 50 * dt;
      }
    }

    // 自动施放技能（简化逻辑）
    if (this.enemies.length > 0) {
      const nearestEnemy = this.enemies[0];
      const dx = nearestEnemy.x - this.player.x;
      const dy = nearestEnemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 近距离使用近战
      if (dist < 80 && this.skillManager.canCastSkill('meleeAttack')) {
        this.skillManager.castSkill('meleeAttack');
        this.checkMeleeHit();
      }
      // 远距离使用火球
      else if (dist > 100 && dist < 200 && this.skillManager.canCastSkill('fireball')) {
        this.skillManager.castSkill('fireball');
        this.spawnFireball();
      }
    }
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    const w = 400;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, 667);

    // 敌人
    for (const enemy of this.enemies) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(enemy.x - 20, enemy.y - 20, 40, 40);
      // 血条
      ctx.fillStyle = '#333';
      ctx.fillRect(enemy.x - 20, enemy.y - 30, 40, 5);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(enemy.x - 20, enemy.y - 30, 40 * ((enemy as any).hp / 50), 5);
    }

    // 玩家
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(this.player.x - 25, this.player.y - 25, 50, 50);

    // 技能按钮
    this.drawSkillButton(ctx, 50, 600, '近战', 'meleeAttack');
    this.drawSkillButton(ctx, 150, 600, '火球', 'fireball');
    this.drawSkillButton(ctx, 250, 600, '治疗', 'heal');

    // 分数
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`分数: ${this.score}`, w / 2, 30);
  }

  private drawSkillButton(ctx: any, x: number, y: number, name: string, skillId: string): void {
    const skill = this.skillManager.getSkill(skillId);
    const state = skill?.getState();
    const cooldownProgress = skill?.getCooldownProgress() || 0;

    // 按钮背景
    ctx.fillStyle = state === SkillState.Ready ? '#4ecdc4' : '#666';
    ctx.fillRect(x - 30, y - 20, 60, 40);

    // 冷却遮罩
    if (state === SkillState.Cooldown) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - 30, y - 20, 60, 40 * cooldownProgress);
    }

    // 技能名称
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y);
  }
}
