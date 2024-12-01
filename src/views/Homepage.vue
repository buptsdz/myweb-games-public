<template>
  <div>
    <!-- 背景游走头像 -->
    <div class="background-random-profile"></div>
    <div class="home">
      <h1>我的工具集</h1>
      <div class="tool-list">
        <el-button type="primary" @click="$router.push('/color-game')">颜色游戏</el-button>
        <!-- 后续可以在这里添加更多工具的入口 -->
      </div>
      <div class="tool-list">
        <el-button type="primary">
          <a href="http://sue.sparkflare.cn" target="_blank" style="color: inherit; text-decoration: none;">我的个人网站</a>
        </el-button>
      </div>

      <div style="display: flex; flex-direction: row; margin-bottom: 6px; margin-top: 30px;align-items: center;">
        <!-- 获取更新时间 -->
        <div class="tooltip1">
          <img :src="require('@/assets/static/images/tubiao/time.png')" class="responsive-img" />
          <p id="bottom-time" style="color: #aeacac; margin: 0; margin-top: 1px; font-size: 16px;">{{ formattedTime }}
          </p>
          <span class="tooltiptext1">{{ tooltipTime }}</span>
        </div>

        <!-- 显示浏览量 -->
        <div class="tooltip2">
          <img :src="require('@/assets/static/images/tubiao/view_count.png')" class="responsive-img"
            style="height: 20px;width: 20px;" />
          <p id="view_count" style="color: #aeacac; margin: 0; margin-top: 3px; font-size: 16px;">{{ viewCount }}</p>
          <span class="tooltiptext2">{{ tooltipViewCount }}</span>
        </div>
      </div>

      <!-- 底部联系方式 -->
      <div class="contact-info">
        <p>如果您对游戏有什么建议或意见，请</p>
        <p>🔗联系作者：</p>
        <p style="display:flex;align-items: center;justify-content: center;">
          <a href="mailto:508936331@qq.com" class="contact-link">
            <img :src="require('@/assets/static/images/software_logos/qq-email-logo.png')" alt="Email"
              class="contact-icon-email" />
            508936331@qq.com
          </a>
        </p>
        <p style="display:flex;align-items: center;justify-content: center;">
          <a href="https://github.com/buptsdz" target="_blank" class="contact-link">
            <img :src="require('@/assets/static/images/software_logos/GitHub_logo.png')" alt="GitHub"
              class="contact-icon-github" /> GitHub
          </a>&nbsp;|&nbsp;
          <a href="https://www.xiaohongshu.com/user/profile/624e74200000000010005b95" target="_blank"
            class="contact-link">
            <img :src="require('@/assets/static/images/software_logos/xiaohongshu.png')" alt="小红书"
              class="contact-icon-xhs" />
            小红书
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axiosRequest from '@/utils/request';
export default {
  name: 'Home-page',
  data() {
    return {
      BackgroundMovingImagePath: require('@/assets/static/images/profile/sleep.jpg'),
      updateDate: "2024-11-29 15:17:17", // 自定义更新日期
      formattedTime: "", // 存储格式化的更新时间
      tooltipTime: "", // 存储显示在tooltip的更新时间
      viewCount: 0, // 存储浏览量
      tooltipViewCount: "", // 存储显示在tooltip的浏览量
    };
  },
  mounted() {
    // 在页面加载时获取浏览量
    const pageName = "tools-homepage"; // 根据实际页面设置
    this.fetchViewCount(pageName);
    this.formatUpdateTime();
  },
  methods: {
    // 获取浏览量
    async fetchViewCount(pageName) {
      try {
        const response = await axiosRequest({
          method: 'get',
          url: '/django/record_page_view/',
          params: {
            page_name: pageName,
          },
        });
        const data = response.data;
        if (data.status === 200) {
          this.viewCount = data.data.view_count;
          this.tooltipViewCount = `页面浏览量：${this.viewCount}`;
        }
        else {
          this.viewCount = '获取失败';
          this.tooltipViewCount = '获取浏览量失败';
        }
      }
      catch (error) {
        this.viewCount = '获取失败';
        this.tooltipViewCount = '获取浏览量失败';
        console.error('Error fetching view count:', error);
      }
    },
    // 格式化更新时间
    formatUpdateTime() {
      const updateDateObj = new Date(this.updateDate);
      const currentDate = new Date();

      if (currentDate.toDateString() === updateDateObj.toDateString()) {
        this.formattedTime = `今天 ${updateDateObj.getHours()}:${String(updateDateObj.getMinutes()).padStart(2, '0')}`;
      } else {
        this.formattedTime = `${String(updateDateObj.getMonth() + 1).padStart(2, '0')}-${String(updateDateObj.getDate()).padStart(2, '0')} ${String(updateDateObj.getHours()).padStart(2, '0')}:${String(updateDateObj.getMinutes()).padStart(2, '0')}`;
      }
      this.tooltipTime = `更新于 ${this.updateDate}`;
    },
  }
};
</script>

<style scoped>
.home {
  padding: 20px;
}

.tool-list {
  margin-top: 20px;
}

.contact-info {
  margin-top: 15px;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  color: #333;
}

.contact-info p {
  margin: 8px 0;
}

.contact-link {
  color: #007BFF;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.contact-link:hover {
  text-decoration: underline;
}

.contact-info p:first-child {
  font-weight: bold;
}

.contact-icon-github {
  width: 22px;
  height: 22px;
  margin-right: 8px;
}

.contact-icon-xhs {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.contact-icon-email {
  width: 52px;
  height: 24px;
  margin-right: 8px;
}

.background-random-profile {
  z-index: 10;
  position: absolute;
  border-radius: 50%;
  width: 97px;
  height: 97px;
  background: url('~@/assets/static/images/profile/sleep.jpg');
  background-blend-mode: lighten;
  background-size: contain;
  animation: horizontal 3.7s infinite -1.4s linear alternate,
    vertical 4.1s infinite -2.1s linear alternate;
  animation-composition: accumulate;
}

@keyframes horizontal {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(100vw - 110%));
  }
}

@keyframes vertical {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(calc(90vh - 100%));
  }
}

@keyframes colorX {
  to {
    filter: hue-rotate(2185deg);
  }
}

@keyframes colorY {
  to {
    filter: hue-rotate(1769deg);
  }
}

.tooltip1,
.tooltip2 {
  display: flex;
  /* 使用 flexbox 来横向排列 */
  align-items: center;
  position: relative;
  width: fit-content;
  padding-bottom: 10px;
}

.tooltip1 .responsive-img {
  height: 23px;
  width: 23px;
  margin-right: 5px;
}

.tooltip2 .responsive-img {
  height: 22px;
  width: 22px;
  margin-right: 5px;
  /* 在图片和文字之间添加一些间距 */
}

.tooltip1 .tooltiptext1,
.tooltip2 .tooltiptext2 {
  visibility: hidden;
  width: fit-content;
  white-space: nowrap;
  background-color: #474747;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 3px 8px;
  position: absolute;
  bottom: 100%;
  z-index: 1;

  /* 淡入 - 1秒内从 0% 到 100% 显示: */
  opacity: 0;
  transition: opacity 0.5s;
}

.tooltip1:hover .tooltiptext1,
.tooltip2:hover .tooltiptext2 {
  visibility: visible;
  opacity: 1;
}

@media (max-width: 500px) {

  /* 手机端样式 */
  .tooltip1 {
    margin-left: 5px;
  }

  .tooltip2 {
    margin-left: 25px;
  }
}

@media (min-width: 501px) {

  /* 电脑端样式 */
  .tooltip1 {
    margin-left: 20px;
  }

  .tooltip2 {
    margin-left: 5%;
  }
}
</style>
