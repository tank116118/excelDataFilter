<template>
  <div class="toolbar">
    <!-- 查询条件 -->
    <div class="query-items">
      <!-- 隐藏的文件输入元素 -->
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleImportFile" 
        style="display: none"
      />
      <!-- 日期范围选择 -->
      <div class="query-item">
        <span class="query-label">日期：</span>
        <a-range-picker 
          v-model:value="dateRange"
          style="width: 220px"
          @change="handleDateChange"
        />
      </div>
      
      <!-- 原ID查询 -->
      <div class="query-item">
        <span class="query-label">ID：</span>
        <a-input
          v-model:value="originalID"
          placeholder="ID"
          style="width: 120px"
          @pressEnter="handleSearch"
        />
      </div>
      
      <!-- 用户名查询 -->
      <div class="query-item">
        <span class="query-label">用户：</span>
        <a-input
          v-model:value="usernameQuery"
          placeholder="用户名"
          style="width: 120px"
          @pressEnter="handleSearch"
        />
      </div>

      <!-- 排序方式 -->
      <div class="query-item">
        <span class="query-label">排序：</span>
        <a-select
          v-model:value="sortField"
          style="width: 120px"
          placeholder="选择排序字段"
        >
          <a-select-option value="originalID">ID</a-select-option>
          <a-select-option value="userName">用户名</a-select-option>
          <a-select-option value="createdAt">创建时间</a-select-option>
        </a-select>
        <a-checkbox
          v-model:checked="isDescending"
          style="margin-left: 8px"
        >
          降序
        </a-checkbox>
      </div>
      
      <!-- 查询按钮 -->
      <a-button type="primary" @click="handleSearch">
        <template #icon><search-outlined /></template>
        查询
      </a-button>
    </div>

    <!-- 功能按钮组 -->
    <div class="action-buttons">
      <a-tooltip title="重置">
        <a-button @click="handleReset" size="middle">
          <template #icon><redo-outlined /></template>
        </a-button>
      </a-tooltip>
      
      <a-tooltip title="导入">
        <a-button type="primary" @click="handleImport" size="middle">
          <template #icon><upload-outlined /></template>
        </a-button>
      </a-tooltip>
      
      <a-tooltip title="导出">
        <a-button type="primary" @click="handleExport" size="middle">
          <template #icon><download-outlined /></template>
        </a-button>
      </a-tooltip>
      
      <a-tooltip title="去重">
        <a-button @click="handleDeduplicate" size="middle">
          <template #icon><filter-outlined /></template>
        </a-button>
      </a-tooltip>
      
      <a-tooltip title="刷新">
        <a-button @click="handleRefresh" size="middle">
          <template #icon><reload-outlined /></template>
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  RedoOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import { useSearchStore } from './store/searchStore'
import { ExcelBrowserHelper } from './utils/excel/excelBrowser'
import UserDatabase from './utils/db/userDB'
import progress from './utils/progress'

const emit = defineEmits([
  'search',
  'reset',
  'import',
  'export',
  'deduplicate',
  'refresh'
])

const searchStore = useSearchStore()

// 查询条件
const dateRange = ref<[Dayjs, Dayjs]>()
const originalID = ref('')
const usernameQuery = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const sortField = ref('createdAt') // 默认排序字段
const isDescending = ref(true) // 默认降序

// 处理日期范围变化
const handleDateChange = (dates: [Dayjs, Dayjs]) => {
  console.log('选择的日期范围:', dates)
}

// 执行查询
const handleSearch = () => {
  searchStore.setSearchParams({
    dateRange: dateRange.value,
    originalID: originalID.value,
    username: usernameQuery.value,
    sortField: sortField.value,
    isDescending: isDescending.value,
    page: 1 // 重置页码
  })
  searchStore.executeSearch()
}

// 重置查询条件
const handleReset = () => {
  searchStore.resetSearchParams()
  dateRange.value = undefined
  originalID.value = ''
  usernameQuery.value = ''
  sortField.value = 'createdAt' // 重置排序字段
  isDescending.value = true
}

// 导入
const handleImport = () => {
    if (fileInput.value) {
        fileInput.value.value = ''; // 先重置值
        fileInput.value.click();
    }
}

const isNumeric=(value: any): boolean => {
    if (typeof value === 'number') {
        return !isNaN(value);
    }
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }
    return false;
}

// 导入详情
const handleImportFile = async (event: Event) => {
  const fileInput = event.target as HTMLInputElement;
  if (!fileInput.files?.length) return;

  const file = fileInput.files[0];
  if (!file) return;

  try {
    const excelHelper = new ExcelBrowserHelper();
    await excelHelper.readFromFile(file);
    const sheet = excelHelper.getSheet(1);
    if (!sheet) {
      message.error('未找到工作表');
      return;
    }

    let data = excelHelper.getAlignedSheetData(sheet);
    if (!data?.length) {
      message.error('导入的Excel数据为空或格式不正确');
      return;
    }

    // 去掉表头
    data = data.slice(1); 

    // 显示进度条
    progress.show({ percent: 0, status: 'active', type: 'circle' });

    // 使用异步分批处理
    const total = data.length;
    const batchSize = Math.ceil(total / 100); // 分成100批处理
    let processed = 0;

    for (let i = 0; i < total; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // 使用setTimeout让UI有机会更新
      await new Promise(resolve => setTimeout(resolve, 0));
      
      for (const row of batch) {
        let originalID = row[0]
        if(!isNumeric(originalID)){
            continue;
        }

        const userDB = new UserDatabase('excel-date-filter');
        try {
            // 初始化数据库
            await userDB.initialize();
            let params = {
                originalID: originalID,
                userName: row[1],
                fullName: row[2],
                profileUrl: row[3],
                avatarUrl: row[4],
                isVerified: row[5]=='Yes'? true : false,
                posts: row[6],
                email: row[7],
                phone: row[8],
                following: row[9],
                followers: row[10],
                biography: row[11],
                city: row[12],
                address: row[13],
                isPrivate: row[14]=='Yes'? true : false,
                isBusiness: row[15]=='Yes'? true : false,
                externalUrl: row[16],
                categoryUrl: row[17],
                followedByYou: row[18],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await userDB.addUser(params);
            await userDB.close();
        } catch (error) {
            console.error('Error:', error);
            await userDB.close();
        }
        processed++;
      }

      const percent = Math.round((processed / total) * 100);
      progress.update(percent);
    }

    // 完成处理
    progress.update(100, { status: 'success' });
    message.success(`导入成功，共处理 ${total} 条数据`);

    // 重新加载数据
    searchStore.resetSearchParams();
    handleSearch();
  } catch (error) {
    console.error('导入失败:', error);
    progress.update(0, { status: 'exception' });
    message.error('导入失败: ' + error);
  } finally {
    setTimeout(() => progress.hide(), 3000);
  }
};

const handleExport = async() => {
  const userDB = new UserDatabase('excel-date-filter');
  await userDB.initialize();

  let conditions: any = {}
  if (dateRange.value) {
    conditions.createdAfter = dateRange.value[0].toDate();
    conditions.createdAfter.setHours(0, 0, 0, 0);
    conditions.createdBefore = dateRange.value[1].toDate();
    conditions.createdBefore.setHours(23, 59, 59, 999);
  }

  if (originalID.value !== undefined && originalID.value !== null && originalID.value !== '') {
    conditions.originalID = Number(originalID.value);
  }

  if (usernameQuery.value) {
    conditions.userName = usernameQuery.value;
  }

  let sortOrder: 'DESC' | 'ASC' = 'DESC'
  if (!isDescending.value) {
    sortOrder = 'ASC'
  }

  const userListResult = await userDB.fuzzyQueryUsers(
    conditions,
    1,
    999999999,
    sortField.value,
    sortOrder
  );
  
  const users = userListResult.data || [];
  if (users.length > 0) {
    const exportData = users.map((user: any) => ({
        'ID': user.originalID,
        '用户名': user.userName,
        '全名': user.fullName,
        '个人主页': user.profileUrl,
        '头像': user.avatarUrl,
        '验证状态': user.isVerified ? 'Yes' : 'No',
        '帖子数': user.posts,
        '邮箱': user.email,
        '电话': user.phone,
        '关注数': user.following,
        '粉丝数': user.followers,
        '简介': user.biography,
        '城市': user.city,
        '地址': user.address,
        '隐私状态': user.isPrivate ? 'Yes' : 'No',
        '商业账号': user.isBusiness ? 'Yes' : 'No',
        '外部链接': user.externalUrl,
        '链接分类': user.categoryUrl,
        '已关注': user.followedByYou
      }));

    const excelHelper = new ExcelBrowserHelper();
    
    try {
      // 创建默认文件名
      const defaultFileName = `用户数据导出_${new Date().toLocaleDateString()}.xlsx`;
      
      await excelHelper.exportToExcel(exportData, {
        fileName: defaultFileName,
        sheetName: '用户数据',
        headerStyle: {
          font: { bold: true, color: { argb: 'FFFFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } },
          alignment: { vertical: 'middle', horizontal: 'center' }
        },
        columnWidths: {
          'ID': 10,
          '用户名': 20,
          '全名': 25,
          '个人主页': 30,
          '头像': 30,
          '验证状态': 15,
          '帖子数': 10,
          '邮箱': 30,
          '电话': 30,
          '关注数': 10,
          '粉丝数': 10,
          '简介': 40,
          '城市': 10,
          '地址': 30,
          '隐私状态': 15,
          '商业账号': 15,
          '外部链接': 30,
          '链接分类': 30,
          '已关注': 10
        }
      });

    } catch (error) {
      message.error('保存文件时出错: ' + error);
    }
  } else {
    message.info('没有找到符合条件的数据');
  }
}

const handleDeduplicate = async () => {
  const userDB = new UserDatabase('excel-date-filter');
  await userDB.initialize();

  const removedCount = await userDB.removeDuplicates(['userName', 'email'], false);
  message.success(`成功删除 ${removedCount} 条重复数据`);
  if (removedCount > 0) {
    searchStore.resetSearchParams();
    handleSearch();
  }

  userDB.close()
}

const handleRefresh = () => {
  window.location.reload()
}
</script>

<style lang="less" scoped>
.toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  
  .query-items {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 12px;
    flex-wrap: wrap;
    
    .query-item {
      display: flex;
      align-items: center;
      
      .query-label {
        white-space: nowrap;
        margin-right: 8px;
        color: rgba(0, 0, 0, 0.85);
        font-size: 14px;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    
    .ant-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>