<template>
  <div class="progress-container" :class="props.type">
    <a-progress
      :percent="props.percent"
      :status="computedStatus"
      :stroke-color="computedStrokeColor"
      :stroke-width="props.strokeWidth"
      :show-info="props.showInfo"
      :type="props.type"
      :width="props.type === 'line' ? undefined : props.circleSize"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';

export default defineComponent({
  name: 'ProgressBar',
  props: {
    percent: {
      type: Number,
      default: 0
    },
    status: {
      type: String as PropType<'normal' | 'active' | 'exception' | 'success'>,
      default: 'normal'
    },
    strokeColor: {
      type: [String, Object, Array] as PropType<string | { [key: string]: string } | string[]>,
      default: undefined
    },
    gradient: {
      type: Object as PropType<{
        from?: string;
        to?: string;
        direction?: string;
        colors?: { color: string; offset: string }[];
      }>,
      default: undefined
    },
    strokeWidth: {
      type: Number,
      default: 8
    },
    showInfo: {
      type: Boolean,
      default: true
    },
    type: {
      type: String as PropType<'line' | 'circle' | 'dashboard'>,
      default: 'line'
    },
    circleSize: {
      type: Number,
      default: 60
    }
  },
  setup(props) {
    const computedStatus = computed(() => {
      if (props.percent >= 100) return 'success';
      return props.status;
    });

    const computedStrokeColor = computed(() => {
      if (props.strokeColor) return props.strokeColor;
      
      // 默认渐变配置
      const defaultGradient = {
        from: '#108ee9',
        to: '#87d068',
        direction: props.type === 'line' ? 'to right' : 'to bottom'
      };
      
      const gradientConfig = props.gradient || defaultGradient;
      
      if (gradientConfig.colors) {
        // 自定义颜色节点
        return gradientConfig.colors;
      } else {
        // 线性渐变
        return {
          '0%': gradientConfig.from || defaultGradient.from,
          '100%': gradientConfig.to || defaultGradient.to
        };
      }
    });

    return {
      props,
      computedStatus,
      computedStrokeColor
    };
  }
});
</script>

<style scoped>
.progress-container {
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.progress-container.line {
  padding: 20px;
}

.progress-container.circle,
.progress-container.dashboard {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(245, 245, 245, 0.7);
  padding: 8px;
  border-radius: 50%;
}

/* 强制覆盖Ant Design的样式 */
.progress-container.circle :deep(.ant-progress-inner),
.progress-container.dashboard :deep(.ant-progress-inner) {
  width: v-bind('props.type === "line" ? "100%" : props.circleSize + "px"') !important;
  height: v-bind('props.type === "line" ? "100%" : props.circleSize + "px"') !important;
  font-size: calc(v-bind('props.circleSize') * 0.2) !important;
}

/* 添加动画效果 */
.progress-container :deep(.ant-progress-bg) {
  transition: all 0.4s cubic-bezier(0.08, 0.82, 0.17, 1) 0s;
}
</style>