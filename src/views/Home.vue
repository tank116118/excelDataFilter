<template>
  <div class="table-container">
    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="data"
      :row-key="record => record.id"
      :pagination="pagination"
      :scroll="{ x: 'max-content' }"
      bordered
      @change="handleTableChange"
    >
      <!-- 自定义验证状态列 -->
      <template #isVerified="{ text }">
        <a-tag :color="text ? 'green' : 'red'">
          {{ text ? '已验证' : '未验证' }}
        </a-tag>
      </template>

      <!-- 自定义隐私状态列 -->
      <template #isPrivate="{ text }">
        <a-tag :color="text ? 'volcano' : 'blue'">
          {{ text ? '私有' : '公开' }}
        </a-tag>
      </template>

      <!-- 自定义商业账户列 -->
      <template #isBusiness="{ text }">
        {{ text ? '是' : '否' }}
      </template>

      <!-- 导入日期 -->
      <template #createdAt="{ text }">
        {{ dayjs(text).format('YYYY-MM-DD') }}
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { useSearchStore } from '../store/searchStore'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import UserDatabase from '../utils/db/userDB'
import dayjs from 'dayjs'

const searchStore = useSearchStore()
const { searchParams } = storeToRefs(searchStore)

// 监听搜索参数变化
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
    conditions.createdAfter = params.dateRange[0].toDate(); // 开始日期
    conditions.createdAfter.setHours(0, 0, 0, 0); // 设置为当天的开始时间
    conditions.createdBefore = params.dateRange[1].toDate(); // 结束日期
    conditions.createdBefore.setHours(23, 59, 59, 999); // 设置为当天的结束时间
  }
  
  // 添加其他查询条件
  if (params.id !== undefined && params.id !== null && params.id !== '') {
    conditions.id = Number(params.id); // 确保转换为数字
  }


  if (params.originalID !== undefined && params.originalID !== null && params.originalID !== '') {
    conditions.originalID = Number(params.originalID); // 确保转换为数字
  }

  if (params.username) {
    conditions.userName = params.username; // 注意字段名大小写
  }

  // console.log('查询条件:', {
  //   ...conditions,
  //   createdAfter: conditions.createdAfter?.toISOString(),
  //   createdBefore: conditions.createdBefore?.toISOString()
  // });

  const userListResult = await userDB.queryUsers(conditions, pagination.value.current, pagination.value.pageSize, 'id', 'DESC');
  // console.log(userListResult)
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

// 表格数据
const data = ref<DataItem[]>([
  // ... (保持原有的数据不变)
])

// 表格列定义
const columns = ref([
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
    fixed: 'left'
  },
  {
    title: '原ID',
    dataIndex: 'originalID',
    width: 80,
    fixed: 'left'
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    width: 120
  },
  {
    title: '全名',
    dataIndex: 'fullName',
    width: 120
  },
  {
    title: '个人主页',
    dataIndex: 'profileUrl',
    width: 150,
    ellipsis: true
  },
  {
    title: '头像',
    dataIndex: 'avatarUrl',
    width: 150,
    ellipsis: true
  },
  {
    title: '验证状态',
    dataIndex: 'isVerified',
    width: 100,
    slots: { customRender: 'isVerified' }
  },
  {
    title: '帖子数',
    dataIndex: 'posts',
    width: 80,
    sorter: (a: DataItem, b: DataItem) => a.posts - b.posts
  },
  {
    title: 'Email',
    dataIndex: 'email',
    width: 180
  },
  {
    title: '电话',
    dataIndex: 'phone',
    width: 120
  },
  {
    title: '关注数',
    dataIndex: 'following',
    width: 90,
    sorter: (a: DataItem, b: DataItem) => a.following - b.following
  },
  {
    title: '粉丝数',
    dataIndex: 'followers',
    width: 90,
    sorter: (a: DataItem, b: DataItem) => a.followers - b.followers
  },
  {
    title: '个人简介',
    dataIndex: 'biography',
    width: 200,
    ellipsis: true
  },
  {
    title: '城市',
    dataIndex: 'city',
    width: 100
  },
  {
    title: '地址',
    dataIndex: 'address',
    width: 150,
    ellipsis: true
  },
  {
    title: '隐私状态',
    dataIndex: 'isPrivate',
    width: 100,
    slots: { customRender: 'isPrivate' }
  },
  {
    title: '商业账户',
    dataIndex: 'isBusiness',
    width: 100,
    slots: { customRender: 'isBusiness' }
  },
  {
    title: '外部链接',
    dataIndex: 'externalUrl',
    width: 150,
    ellipsis: true
  },
  {
    title: '分类链接',
    dataIndex: 'categoryUrl',
    width: 150,
    ellipsis: true
  },
  {
    title: '已关注',
    dataIndex: 'followedByYou',
    width: 100,
    slots: { customRender: 'followedByYou' }
  },
  {
    title: '导入日期',
    dataIndex: 'createdAt',
    width: 150,
    slots: { customRender: 'createdAt' },
    fixed: 'right'
  }
])

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 100,
  total: 1,
  showSizeChanger: true,
  pageSizeOptions: ['100', '200', '500', '1000'],
  showTotal: (total: number) => `共 ${total} 条数据`
})

// 表格变化处理
const handleTableChange: TableProps['onChange'] = (pag, filters, sorter) => {
  pagination.value.current = pag.current!
  pagination.value.pageSize = pag.pageSize!
  // 这里可以添加数据请求逻辑
}
</script>

<style scoped>
.table-container {
  background: #fff;
  height: calc(100vh - 240px); /* 减去padding */
  display: flex;
  flex-direction: column;
}

/* 表格容器样式 */
:deep(.ant-table-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 表格样式 */
:deep(.ant-table) {
  flex: 1;
  width: 100% !important;
}

/* 表格内容区域 */
:deep(.ant-table-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 表格主体 */
:deep(.ant-table-body) {
  flex: 1;
  overflow: auto;
}

/* 表头固定 */
:deep(.ant-table-thead) {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* 分页样式 */
:deep(.ant-pagination) {
  margin-top: 16px;
  flex-shrink: 0;
}
</style>