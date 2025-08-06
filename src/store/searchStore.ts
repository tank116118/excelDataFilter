import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchStore = defineStore('search', () => {
  const searchParams = ref({
    dateRange: undefined,
    id: '',
    username: '',
    page: 1
  })

  function setSearchParams(params: any) {
    searchParams.value = { ...searchParams.value, ...params }
  }

  function resetSearchParams() {
    searchParams.value = {
      dateRange: undefined,
      id: '',
      username: '',
      page: 1
    }
  }

  function executeSearch() {
    // 实际查询逻辑
    // 这里只是示例
    // console.log('执行查询', searchParams.value)
  }

  return {
    searchParams,
    setSearchParams,
    resetSearchParams,
    executeSearch
  }
})