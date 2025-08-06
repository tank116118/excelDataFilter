<template>
  <a-progress
    :percent="animatedPercent"
    :stroke-color="gradientColor"
    :stroke-width="strokeWidth"
    :type="type"
  />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

type ProgressType = 'line' | 'circle' | 'dashboard';
type StrokeColor = string | { [key: string]: string } | string[];

export default defineComponent({
  name: 'AnimatedProgress',
  props: {
    percent: {
      type: Number,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 100
    },
    duration: {
      type: Number,
      default: 1000
    },
    strokeWidth: {
      type: Number,
      default: 8
    },
    type: {
      type: String as PropType<ProgressType>,
      default: 'line' as ProgressType
    }
  },
  setup(props) {
    const animatedPercent = ref(0);
    let animationFrame: number | null = null;

    const gradientColor = computed<StrokeColor>(() => ({
      '0%': '#108ee9',
      '100%': '#87d068'
    }));

    const animateProgress = (target: number): void => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      const start = animatedPercent.value;
      const change = target - start;
      const startTime = performance.now();
      
      const animate = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / props.duration, 1);
        animatedPercent.value = start + change * progress;
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
    };

    watch(() => props.percent, (newVal: number) => {
      animateProgress(newVal);
    });

    onMounted(() => {
      animateProgress(props.percent);
    });

    onBeforeUnmount(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    });

    return {
      animatedPercent,
      gradientColor
    };
  }
});
</script>