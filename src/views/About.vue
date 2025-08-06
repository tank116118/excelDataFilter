<template>
  <a-layout class="about-layout">
    <a-page-header
      title="关于我们"
      sub-title="了解我们的团队和使命"
      @back="() => router.push('/')"
    />
    
    <a-layout-content class="about-content">
      <a-card title="公司简介" :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :span="24" :md="12">
            <a-image
              width="100%"
              src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
              alt="公司图片"
            />
          </a-col>
          <a-col :span="24" :md="12">
            <h3>我们的故事</h3>
            <p>
              成立于2015年，我们致力于通过技术创新改变世界。
              我们的团队由来自全球各地的优秀工程师、设计师和产品专家组成。
            </p>
            <a-divider />
            <h3>核心价值观</h3>
            <a-list item-layout="horizontal" :data-source="values">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :description="item.description"
                  >
                    <template #title>
                      <a-tag :color="item.color">{{ item.title }}</a-tag>
                    </template>
                    <template #avatar>
                      <a-avatar :icon="item.icon" :style="{ backgroundColor: item.color }" />
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-col>
        </a-row>
      </a-card>

      <a-card title="团队成员" style="margin-top: 24px">
        <a-row :gutter="[16, 16]">
          <a-col 
            v-for="member in teamMembers" 
            :key="member.name"
            :span="24" 
            :md="8" 
            :lg="6"
          >
            <a-card hoverable>
              <template #cover>
                <a-image
                  :src="member.avatar"
                  height="200px"
                  :preview="false"
                />
              </template>
              <a-card-meta :title="member.name" :description="member.position">
                <template #avatar>
                  <a-avatar :src="member.avatar" />
                </template>
              </a-card-meta>
              <template #actions>
                <a-tooltip title="Github">
                  <github-outlined @click="openLink(member.github)" />
                </a-tooltip>
                <a-tooltip title="LinkedIn">
                  <linkedin-outlined @click="openLink(member.linkedin)" />
                </a-tooltip>
                <a-tooltip title="发送邮件">
                  <mail-outlined @click="sendEmail(member.email)" />
                </a-tooltip>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </a-layout-content>

    <a-layout-footer style="text-align: center">
      Ant Design Vue ©2023 Created by Ant UED
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { 
  GithubOutlined, 
  LinkedinOutlined, 
  MailOutlined 
} from '@ant-design/icons-vue'

interface CoreValue {
  title: string
  description: string
  icon: string
  color: string
}

interface TeamMember {
  name: string
  position: string
  avatar: string
  github?: string
  linkedin?: string
  email?: string
}

export default defineComponent({
  name: 'AboutPage',
  components: {
    GithubOutlined,
    LinkedinOutlined,
    MailOutlined
  },
  setup() {
    const router = useRouter()

    const values: CoreValue[] = [
      {
        title: '创新',
        description: '不断探索新技术，推动产品边界',
        icon: 'bulb',
        color: 'gold'
      },
      {
        title: '协作',
        description: '跨职能团队紧密合作，共同成长',
        icon: 'team',
        color: 'blue'
      },
      {
        title: '诚信',
        description: '坚持道德标准，做正确的事',
        icon: 'safety-certificate',
        color: 'green'
      }
    ]

    const teamMembers: TeamMember[] = [
      {
        name: '张三',
        position: 'CEO & 创始人',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        email: 'ceo@example.com'
      },
      {
        name: '李四',
        position: 'CTO',
        avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        github: 'https://github.com',
        email: 'cto@example.com'
      },
      {
        name: '王五',
        position: '产品总监',
        avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        linkedin: 'https://linkedin.com'
      },
      {
        name: '赵六',
        position: '前端工程师',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        github: 'https://github.com'
      }
    ]

    const openLink = (url?: string) => {
      if (url) window.open(url, '_blank')
    }

    const sendEmail = (email?: string) => {
      if (email) window.location.href = `mailto:${email}`
    }

    return {
      router,
      values,
      teamMembers,
      openLink,
      sendEmail
    }
  }
})
</script>

<style scoped>
.about-layout {
  min-height: 100vh;
}

.about-content {
  padding: 24px;
  margin: 0 auto;
  max-width: 1200px;
}
</style>