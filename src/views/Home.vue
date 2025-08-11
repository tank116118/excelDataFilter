<template>
  <div class="table-container">
    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="data"
      :row-key="(record: DataItem) => record.id"
      :pagination="pagination"
      :scroll="{ x: 'max-content', y: tableScrollY }"
      bordered
      @change="handleTableChange"
    >
      <!-- 自定义验证状态列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isVerified'">
          <a-tag :color="record.isVerified ? 'green' : 'red'">
            {{ record.isVerified ? '已验证' : '未验证' }}
          </a-tag>
        </template>

        <!-- 自定义隐私状态列 -->
        <template v-else-if="column.key === 'isPrivate'">
          <a-tag :color="record.isPrivate ? 'volcano' : 'blue'">
            {{ record.isPrivate ? '私有' : '公开' }}
          </a-tag>
        </template>

        <!-- 自定义商业账户列 -->
        <template v-else-if="column.key === 'isBusiness'">
          {{ record.isBusiness ? '是' : '否' }}
        </template>

        <!-- 导入日期 -->
        <template v-else-if="column.key === 'createdAt'">
          {{ dayjs(record.createdAt).format('YYYY-MM-DD') }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { useSearchStore } from '../store/searchStore'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import UserDatabase from '../utils/db/userDB'
import dayjs from 'dayjs'

const searchStore = useSearchStore()
const { searchParams } = storeToRefs(searchStore)

// 添加表格滚动高度计算
const tableScrollY = ref<string | undefined>(undefined)

// 计算表格高度
const calculateTableHeight = () => {
  const tableContainer = document.querySelector('.table-container')
  if (tableContainer) {
    const headerHeight = 55
    const paginationHeight = 64
    const padding = 8
    
    const height = tableContainer.clientHeight - headerHeight - paginationHeight - padding
    tableScrollY.value = `${Math.max(height, 100)}px`
  }
}

onMounted(() => {
  calculateTableHeight()
  window.addEventListener('resize', calculateTableHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateTableHeight)
})

watch(
  () => searchParams.value,
  (newParams) => {
    if (Object.keys(newParams).length > 0) {
      fetchData(newParams)
    }
  },
  { deep: true, immediate: true }
)

async function fetchData(params: any) {
  const userDB = new UserDatabase('excel-date-filter');
  await userDB.initialize();

  let conditions: any = {}
  if (params.dateRange) {
    conditions.createdAfter = params.dateRange[0].toDate();
    conditions.createdAfter.setHours(0, 0, 0, 0);
    conditions.createdBefore = params.dateRange[1].toDate();
    conditions.createdBefore.setHours(23, 59, 59, 999);
  }
  
  if (params.originalID !== undefined && params.originalID !== null && params.originalID !== '') {
    conditions.originalID = Number(params.originalID);
  }

  if (params.username) {
    conditions.userName = params.username;
  }

  let sortOrder: 'DESC' | 'ASC' = 'DESC'
  if (!params.isDescending) {
    sortOrder = 'ASC'
  }

  const userListResult = await userDB.fuzzyQueryUsers(conditions, params.page, pagination.value.pageSize, params.sortField, sortOrder);
  const users = userListResult.data || [];
  if (users.length > 0) {
    data.value = users.map((user: any) => ({
      ...user,
      id: String(user.id ?? ''),
    }))
    const stats = await userDB.getUserStatistics(conditions);
    pagination.value.total = stats.total;
  } else {
    data.value = [];
    pagination.value.total = 0;
  }
}

interface DataItem {
  id: string
  userName: string
  fullName: string
  profileUrl: string
  avatarUrl: string
  isVerified: boolean
  posts: number
  email: string
  phone: string
  following: number
  followers: number
  biography: string
  city: string
  address: string
  isPrivate: boolean
  isBusiness: boolean
  externalUrl: string
  categoryUrl: string
  followedByYou: number
}

const data = ref<DataItem[]>([])

// 修改后的列定义（移除所有slots）
const columns = ref([
  {
    title: 'ID',
    dataIndex: 'originalID',
    width: 80,
    fixed: 'left',
    key: 'originalID'
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    width: 120,
    key: 'userName'
  },
  {
    title: '全名',
    dataIndex: 'fullName',
    width: 120,
    key: 'fullName'
  },
  {
    title: '个人主页',
    dataIndex: 'profileUrl',
    width: 150,
    ellipsis: true,
    key: 'profileUrl'
  },
  {
    title: '头像',
    dataIndex: 'avatarUrl',
    width: 150,
    ellipsis: true,
    key: 'avatarUrl'
  },
  {
    title: '验证状态',
    dataIndex: 'isVerified',
    width: 100,
    key: 'isVerified'
  },
  {
    title: '帖子数',
    dataIndex: 'posts',
    width: 80,
    sorter: (a: DataItem, b: DataItem) => a.posts - b.posts,
    key: 'posts'
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    width: 180,
    key: 'email'
  },
  {
    title: '电话',
    dataIndex: 'phone',
    width: 120,
    key: 'phone'
  },
  {
    title: '关注数',
    dataIndex: 'following',
    width: 90,
    sorter: (a: DataItem, b: DataItem) => a.following - b.following,
    key: 'following'
  },
  {
    title: '粉丝数',
    dataIndex: 'followers',
    width: 90,
    sorter: (a: DataItem, b: DataItem) => a.followers - b.followers,
    key: 'followers'
  },
  {
    title: '简介',
    dataIndex: 'biography',
    width: 200,
    ellipsis: true,
    key: 'biography'
  },
  {
    title: '城市',
    dataIndex: 'city',
    width: 100,
    key: 'city'
  },
  {
    title: '地址',
    dataIndex: 'address',
    width: 150,
    ellipsis: true,
    key: 'address'
  },
  {
    title: '隐私状态',
    dataIndex: 'isPrivate',
    width: 100,
    key: 'isPrivate'
  },
  {
    title: '商业账户',
    dataIndex: 'isBusiness',
    width: 100,
    key: 'isBusiness'
  },
  {
    title: '外部链接',
    dataIndex: 'externalUrl',
    width: 150,
    ellipsis: true,
    key: 'externalUrl'
  },
  {
    title: '链接分类',
    dataIndex: 'categoryUrl',
    width: 150,
    ellipsis: true,
    key: 'categoryUrl'
  },
  {
    title: '已关注',
    dataIndex: 'followedByYou',
    width: 100,
    key: 'followedByYou'
  },
  {
    title: '导入日期',
    dataIndex: 'createdAt',
    width: 150,
    key: 'createdAt',
    fixed: 'right'
  }
])

const pagination = ref({
  current: 1,
  pageSize: 100,
  total: 1,
  showSizeChanger: true,
  pageSizeOptions: ['100', '200', '500', '1000'],
  showTotal: (total: number) => `共 ${total} 条数据`
})

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.value.current = pag.current!
  pagination.value.pageSize = pag.pageSize!
  fetchData({
    ...searchParams.value,
    page: pag.current
  })
}
</script>

<style scoped>
.table-container {
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.ant-table) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.ant-table-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.ant-table-body) {
  flex: 1;
  overflow: auto !important;
}

:deep(.ant-table-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}

:deep(.ant-pagination) {
  margin-top: 16px;
  flex-shrink: 0;
}
</style>