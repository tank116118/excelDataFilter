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
      
      <!-- ID查询 -->
      <div class="query-item">
        <span class="query-label">ID：</span>
        <a-input
          v-model:value="idQuery"
          placeholder="ID"
          style="width: 120px"
          @pressEnter="handleSearch"
        />
      </div>

      <!-- 原ID查询 -->
      <div class="query-item">
        <span class="query-label">原ID：</span>
        <a-input
          v-model:value="originalID"
          placeholder="原ID"
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
const idQuery = ref('')
const originalID = ref('')
const usernameQuery = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// 处理日期范围变化
const handleDateChange = (dates: [Dayjs, Dayjs]) => {
  console.log('选择的日期范围:', dates)
}

// 执行查询
const handleSearch = () => {
  searchStore.setSearchParams({
    dateRange: dateRange.value,
    id: idQuery.value,
    originalID: originalID.value,
    username: usernameQuery.value,
    page: 1 // 重置页码
  })
  searchStore.executeSearch()
}

// 重置查询条件
const handleReset = () => {
  searchStore.resetSearchParams()
  dateRange.value = undefined
  idQuery.value = ''
  usernameQuery.value = ''
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

    const userDB = new UserDatabase('excel-date-filter');
    await userDB.initialize();
    await userDB.dropTable();
    userDB.close()
    
    // 去掉表头
    data = data.slice(1); 

    // 显示进度条
    progress.show({ percent: 0, status: 'active' });

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

  } catch (error) {
    console.error('导入失败:', error);
    progress.update(0, { status: 'exception' });
    message.error('导入失败: ' + error);
  } finally {
    setTimeout(() => progress.hide(), 3000);
  }
};

const handleExport = () => {
  message.info('点击了导出按钮')
}

const handleDeduplicate = () => {
  message.info('点击了去重按钮')
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