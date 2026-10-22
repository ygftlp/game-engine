// 对话框组件：支持标题、内容、按钮、模态显示。
import { UIWidget } from './UIWidget';
import { Button } from './Button';
import { Label } from './Label';
import { Renderer } from '../render/Renderer';

export interface DialogButton {
  text: string;
  callback?: () => void;
  color?: string;
}

export class Dialog extends UIWidget {
  /** 标题 */
  title = '';
  /** 内容 */
  content = '';
  /** 按钮列表 */
  buttons: DialogButton[] = [];
  /** 是否模态 */
  modal = true;
  /** 遮罩颜色 */
  maskColor = 'rgba(0,0,0,0.5)';
  /** 标题栏颜色 */
  titleBarColor = '#2d2d44';
  /** 内容区颜色 */
  contentColor = '#1a1a2e';
  /** 关闭回调 */
  onCloseCallback: (() => void) | null = null;

  private titleLabel: Label;
  private contentLabel: Label;
  private buttonWidgets: Button[] = [];

  constructor(width = 300, height = 200) {
    super();
    this.width = width;
    this.height = height;
    this.borderRadius = 12;
    this.interactive = true;

    this.titleLabel = new Label('', width, 40);
    this.titleLabel.font = 'bold 18px sans-serif';
    this.titleLabel.textAlign = 'center';
    this.titleLabel.verticalAlign = 'middle';
    this.addChild(this.titleLabel);

    this.contentLabel = new Label('', width - 40, 80);
    this.contentLabel.font = '14px sans-serif';
    this.contentLabel.textAlign = 'center';
    this.contentLabel.verticalAlign = 'middle';
    this.contentLabel.wordWrap = true;
    this.addChild(this.contentLabel);
  }

  /** 设置标题 */
  setTitle(title: string): void {
    this.title = title;
    this.titleLabel.text = title;
  }

  /** 设置内容 */
  setContent(content: string): void {
    this.content = content;
    this.contentLabel.text = content;
  }

  /** 添加按钮 */
  addButton(text: string, callback?: () => void, color?: string): void {
    this.buttons.push({ text, callback, color });
    this.rebuildButtons();
  }

  /** 重建按钮 */
  private rebuildButtons(): void {
    // 移除旧按钮
    for (const btn of this.buttonWidgets) {
      btn.removeFromParent();
    }
    this.buttonWidgets = [];

    // 创建新按钮
    const buttonWidth = Math.min(100, (this.width - 40 - (this.buttons.length - 1) * 10) / this.buttons.length);
    const startX = -(this.buttons.length * (buttonWidth + 10) - 10) / 2;

    for (let i = 0; i < this.buttons.length; i++) {
      const btnConfig = this.buttons[i];
      const btn = new Button(btnConfig.text, buttonWidth, 36);
      btn.x = startX + i * (buttonWidth + 10) + buttonWidth / 2;
      btn.y = this.height / 2 - 30;
      if (btnConfig.color) {
        btn.setStyle({ normalColor: btnConfig.color });
      }
      btn.onClickCallback = () => {
        if (btnConfig.callback) btnConfig.callback();
        this.close();
      };
      this.addChild(btn);
      this.buttonWidgets.push(btn);
    }
  }

  /** 显示对话框 */
  show(): void {
    this.visible = true;
  }

  /** 关闭对话框 */
  close(): void {
    this.visible = false;
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 绘制模态遮罩
    if (this.modal) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.maskColor;
      ctx.fillRect(0, 0, renderer.width, renderer.height);
      ctx.restore();
    }

    // 绘制对话框背景
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;

    ctx.fillStyle = this.contentColor;
    this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
    ctx.fill();

    // 绘制标题栏（使用裁剪避免圆角重叠）
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, this.width, 40);
    ctx.clip();
    ctx.fillStyle = this.titleBarColor;
    this.drawRoundRect(ctx, x, y, this.width, 40, this.borderRadius);
    ctx.fill();
    ctx.restore();

    // 更新标签位置
    this.titleLabel.y = y + 20;
    this.contentLabel.y = y + 60;
  }
}