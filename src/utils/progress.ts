import { createApp, ref, watch,createVNode} from 'vue';
import type { App } from 'vue';
import ProgressBar from '../components/ProgressBar.vue';

type ProgressStatus = 'normal' | 'active' | 'exception' | 'success';
type ProgressType = 'line' | 'circle' | 'dashboard';
type StrokeColor = string | { [key: string]: string } | string[];

interface ProgressOptions {
  percent?: number;
  status?: ProgressStatus;
  strokeColor?: StrokeColor;
  strokeWidth?: number;
  showInfo?: boolean;
  type?: ProgressType;
  circleSize?: number;
}

class ProgressService {
  private static instance: ProgressService;
  private app: App<Element> | null = null;
  private container: HTMLElement | null = null;
  private state = ref({
    percent: 0,
    status: 'normal' as ProgressStatus,
    strokeColor: undefined as StrokeColor | undefined,
    strokeWidth: 8,
    showInfo: true,
    type: 'line' as ProgressType,
    circleSize: 80
  });

  private constructor() {}

  public static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  public show(options: ProgressOptions = {}): void {
    if (!this.app) {
      this.container = document.createElement('div');
      document.body.appendChild(this.container);
      
      // 创建组件实例并传递响应式状态
      this.app = createApp({
        render: () => createVNode(ProgressBar, { ...this.state.value })
      });
      
      this.app.mount(this.container);
      
      // 添加状态变化监听
      watch(this.state, () => {
        if (this.app) {
          // 强制更新组件
          this.app._instance?.proxy?.$forceUpdate();
        }
      }, { deep: true });
    }
    
    this.update(options);
  }

  public update(options: Partial<ProgressOptions>): void {
    // 正确更新响应式对象
    Object.keys(options).forEach(key => {
      if (key in this.state.value) {
        (this.state.value as any)[key] = (options as any)[key];
      }
    });
  }

  public hide(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.app) {
      this.app.unmount();
    }
    this.app = null;
    this.container = null;
  }
}

// 导出单例实例
const progress = ProgressService.getInstance();

export const showProgress = (options?: ProgressOptions) => progress.show(options);
export const updateProgress = (percent: number, options?: Partial<ProgressOptions>) => 
  progress.update({ percent, ...options });
export const hideProgress = () => progress.hide();

export default {
  show: showProgress,
  update: updateProgress,
  hide: hideProgress
};