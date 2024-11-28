<template>
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

    <!-- 底部联系方式 -->
    <div class="contact-info">
      <p>作者联系方式：</p>
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
</template>

<script>
export default {
  name: 'Home-page'
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.tool-list {
  margin-top: 20px;
}

.contact-info {
  margin-top: 40px;
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
</style>
