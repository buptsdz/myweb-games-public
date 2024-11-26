// src/views/Home.vue
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
</style>
