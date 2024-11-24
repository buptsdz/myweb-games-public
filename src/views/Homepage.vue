// src/views/Home.vue
<template>
  <div class="home">
    <h1>我的工具集</h1>
    <div class="tool-list">
      <el-button type="primary" @click="$router.push('/color-game')">颜色游戏</el-button>
      <!-- 后续可以在这里添加更多工具的入口 -->
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
