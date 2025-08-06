<template>
  <a-progress
    :percent="props.percent"
    :status="computedStatus"
    :stroke-color="props.strokeColor"
    :stroke-width="props.strokeWidth"
    :show-info="props.showInfo"
    :type="props.type"
    :width="props.circleSize"
  />
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
      default: 80
    }
  },
  setup(props) {
    const computedStatus = computed(() => {
      if (props.percent >= 100) return 'success';
      return props.status;
    });

    return {
      props,
      computedStatus
    };
  }
});
</script>