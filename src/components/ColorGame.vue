<template>
  <div class="color-game">
    <!-- 模式切换按钮 -->
    <div class="mode-selector">
      <button @click="confirmSwitchMode('normal')" :class="{ active: gameMode === 'normal' }">无尽模式</button>
      <button @click="confirmSwitchMode('timed')" :class="{ active: gameMode === 'timed' }">竞速模式</button>
      <button @click="confirmSwitchMode('open')" :class="{ active: gameMode === 'open' }">外挂模式(测试版)</button>
    </div>

    <!-- 计时器 -->
    <div v-if="gameMode === 'timed'" class="timer timer-display">
      {{ remainingTime.toFixed(2) }}s
    </div>

    <!-- 分数和成就显示 -->
    <div class="game-header">
      <div class="score">分数: {{ score }}</div>
      <div v-if="currentAchievement" class="achievement-notification">
        <el-alert :title="`解锁成就：${currentAchievement}`" type="success" :closable="false" show-icon />
      </div>
    </div>
    <!-- <h1 style="color: white;font-size: 35px;">当前游戏正在进行较大更新，排行榜可能存在bug，请勿上传分数</h1>
    <h1 style="color: white;font-size: 35px;">竞速模式为测试版</h1> -->

    <!-- 游戏网格 -->
    <div class="game-container" :style="gridStyle">
      <div v-for="(color, index) in colors" :key="index" class="color-block" :style="{ backgroundColor: color }"
        @click="handleColorClick(index)"></div>
    </div>

    <!-- 控制按钮 -->
    <div class="game-controls">
      <el-button type="primary" @click="showAchievements = true">查看成就</el-button>
      <el-button type="danger" @click="restartGame">重新开始</el-button>
    </div>

    <!-- 成就对话框 -->
    <el-dialog title="游戏成就" :visible.sync="showAchievements" customClass="reward-width">
      <div class="achievements-list" v-if="gameMode === 'normal' || gameMode === 'timed'">
        <el-tag v-for="(achieved, title) in currentAchievements" :key="title" :type="achieved ? 'success' : 'info'"
          class="achievement-tag">
          {{ title }}
        </el-tag>
      </div>
      <div v-if="gameMode === 'open'">外挂模式暂无成就，如果需要请留言</div>
    </el-dialog>

    <!-- 修改后的游戏结束对话框 -->
    <el-dialog title="游戏结束" :visible.sync="showGameOver" customClass="gameover-width" @close="restartGame"
      :close-on-click-modal="false">
      <div class="game-over-content">
        <p class="final-score">你到达了第<span style="color: rgb(232, 101, 39)"> {{ level }} </span>关 </p>
        <p class="final-score">获得了<span style="color: rgb(50,225,50)"> {{ score }} </span>分！</p>
        <span style="text-align: right; display: block;">
          <el-button type="primary" @click="showUploadScore">上传分数</el-button>
          <el-button @click="restartGame">重新开始</el-button>
        </span>
      </div>
      <div class="achievements-earned" v-if="gameMode === 'normal' || gameMode === 'timed'">
        <h3>已获得成就：</h3>
        <el-tag :style="{ display: achieved ? 'inline-block' : 'none' }"
          v-for="(achieved, title) in currentAchievements" :key="title" type="success" class="achievement-tag">
          {{ title }}
        </el-tag>
      </div>
    </el-dialog>

    <!-- 上传分数对话框 -->
    <el-dialog title="上传分数" :visible.sync="showUploadDialog" customClass="gameover-width" :close-on-click-modal="false">
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadForm" @submit.native.prevent>
        <el-form-item label="留下您的大名，为您获取排名" prop="username">
          <el-input v-model="uploadForm.username" placeholder="请输入昵称"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="submitScore">确定</el-button>
      </span>
    </el-dialog>

    <!-- 排名结果对话框 -->
    <el-dialog title="排名结果" :visible.sync="showRankResult" customClass="gameover-width">
      <div class="rank-result">
        <p>恭喜！您的最好成绩排名第 <span class="highlight">{{ currentRank }}</span> 名</p>
        <p v-if="isBreakRecord" class="break-record">新纪录！</p>
      </div>
    </el-dialog>

    <!-- 显示最大轮数 -->
    <div class="max-level-display">
      <!-- 显示最大轮数和最高分 -->
      <div class="max-level-display">
        <p v-if="gameMode == 'normal'">最大轮数: {{ maxLevel }}</p>
        <p v-if="gameMode == 'normal'">最高分: {{ maxScore }}</p>

        <p v-if="gameMode == 'timed'">最大轮数（计时模式）: {{ maxLevelTimed }}</p>
        <p v-if="gameMode == 'timed'">最高分（计时模式）: {{ maxScoreTimed }}</p>

        <p v-if="gameMode == 'open'">当前为外挂专用模式，mode参数为"open"</p>
        <p v-if="gameMode == 'open'">请不要过度刷榜</p>
      </div>
    </div>

    <!-- 排行榜 -->
    <div class="leaderboard">
      <div class="leaderboard-header" style="position: relative;">
        <el-button type="text" class="refresh-btn" @click="refreshLeaderboard"
          style="position: absolute; left: 0; top: 22px;">
          <i class="el-icon-refresh"></i> 刷新排行榜
        </el-button>
        <h2 class="leaderboard-title" style="margin: 0;">
          排行榜（{{ modeTitles[gameMode] }}）
        </h2>
      </div>

      <!-- 数据表格 -->
      <el-table :data="leaderboardData" style="width: 100%"
        :header-cell-style="{ background: '#4527A0', color: 'white' }" :row-class-name="setRowClassName"
        :empty-text="leaderboardError ? '获取排行数据失败' : '暂时无人挑战，快来留下你的战绩吧'">

        <el-table-column prop="rank" label="排名" width="80" align="center">
          <template #default="scope">
            <div class="rank-number" :class="getRankClass(scope.row.rank)">
              {{ scope.row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="achievement" label="头衔"></el-table-column>
        <el-table-column prop="max_score" label="分数" width="100"></el-table-column>
        <el-table-column prop="record_broken_at" label="破纪录时间" width="180"></el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: center;">
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalUsers" layout="prev, pager, next"
          :pager-count="pagerCount" @current-change="handlePageChange" class="custom-pagination" />
      </div>
    </div>
  </div>
</template>

<script>
import axiosRequest from '@/utils/request';
export default {
  name: 'ColorGame',
  data() {
    return {
      score: 0,
      level: 1,
      gridSize: 2,
      colors: [],
      targetIndex: 0,
      clickedIndex: -1,
      showAchievements: false,
      showGameOver: false,
      currentAchievement: '',
      achievements: {
        '色盲': false,
        '色弱': false,
        '肉眼凡胎': false,
        '一眼丁真': false,
        '目光犀利': false,
        '初出茅庐': false,
        '火眼初成': false,
        '锋芒毕露': false,
        '成绩斐然': false,
        '得心应手': false,
        '游刃有余': false,
        '炉火纯青': false,
        '登峰造极': false,
        '出神入化': false,
        '绝世无双': false,
        '绝世无双-Pro': false,
        '绝世无双-Ultra': false,
        '绝世无双-Plus': false,
        '绝世无双-Max': false,
        '绝世无双-Pro-Max': false,
        '绝世无双-Ultra-Pro-Max': false,
        '绝世无双-Plus-Ultra-Pro-Max': false,
        '淬体境': false,
        '聚气境': false,
        '蜕凡境': false,
        '人元境': false,
        '真阳境': false,
        '灵武境': false,
        '天罡境': false,
        '玄冥境': false,
        '化宗境': false,
        '虚空境': false,
        '洞虚境': false,
        '阴阳境': false,
        '四极境': false,
        '轮回境': false,
        '大武境': false,
        '王者境': false,
        '元尊境': false,
        '至尊境': false,
        '主宰境': false,
        '皇者境': false,
        '天王境': false,
        '界王境': false,
        '破天境': false,
        '合天境': false,
        '融天境': false,
        '原神启动境': false
      },
      achievements_timed: {
        '太慢了': false,
        '慢': false,
        '差点意思': false,
        '还行': false,
        '有点意思': false,
        '哎哟不错哦': false,
        '渐入佳境': false,
        '眼感火热': false,
        '电眼逼人': false,
        '唯快不破': false,
        '人肉3090': false,
        '人肉4060': false,
        '人肉4090': false,
        '人肉A100': false
      },
      maxLevel: 1,
      maxScore: 0,
      maxLevelTimed: 1,
      maxScoreTimed: 0,
      showUploadDialog: false,
      showRankResult: false,
      leaderboardData: [],
      leaderboardError: false, // 排行榜获取状态
      currentPage: 1,      // 当前页数
      pageSize: 20,        // 每页显示条数
      uploadForm: {
        username: localStorage.getItem('username') || ''
      },
      uploadRules: {
        username: [
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
        ]
      },
      currentRank: 0,
      isBreakRecord: false,
      totalUsers: 0,
      gameMode: 'normal', // 当前模式，默认无尽模式
      remainingTime: 60.00,  // 限时模式下的剩余时间
      timer: null,        // 定时器句柄
      timed_playing: false, // 是否正在限时模式下游戏
      pagerCount: 5,  // 初始值，可以根据需要设置一个默认值
      modeTitles: {
        normal: '无尽',
        timed: '竞速',
        open: '外挂',
      }
    };
  },
  created() {
    this.loadGameData();
    this.generateColors();
    this.initLeaderboard(); // 获取初始排行榜数据
  },
  mounted() {
    this.updatePagerCount(); // 页面加载时根据屏幕宽度设置 pagerCount
    window.addEventListener('resize', this.updatePagerCount); // 监听窗口大小变化
  },
  destroyed() {
    window.removeEventListener('resize', this.updatePagerCount); // 组件销毁时移除监听
    clearInterval(this.timer); // 防止内存泄漏
  },
  computed: {
    // 根据 mode 动态选择成就数据源
    currentAchievements() {//不同于currentAchievement
      if (this.gameMode == 'normal') {
        return this.achievements;
      }
      else if (this.gameMode == 'timed') {
        return this.achievements_timed;
      } else {
        return {};
      }
    },
    // 计算总方块数
    totalSquares() {
      return this.gridSize * this.gridSize;
    },
    // 计算网格样式
    gridStyle() {
      const containerWidth = 300 + this.gridSize * 0.2 * 100;
      return {
        '--grid-size': this.gridSize,
        '--container-width': `${containerWidth}px`,
        gridTemplateColumns: `repeat(${this.gridSize}, 1fr)`
      };
    },
  },
  watch: {
    // 监听 timedPlaying 的变化
    score(newVal) {
      if (newVal && this.score > 0 && !this.timed_playing && this.gameMode == 'timed') {
        this.timed_playing = true;
        this.startTimer();
      }
      if (newVal > this.level * 1000) {
        //刷新网页
        location.reload();
        console.log('刷新网页');
      }
    },
    level(newVal) {
      if (newVal > this.score + 2) {
        //刷新网页
        location.reload();
        console.log('刷新网页');
      }
    }
  },
  methods: {
    // 更新分页页码数量
    updatePagerCount() {
      // 获取屏幕宽度
      const screenWidth = window.innerWidth * 0.8;

      // 假设每个页码按钮的宽度是 40px + 10px 的间隔
      const pagerWidth = 40; // 每个页码按钮宽度
      const gapWidth = 10;   // 每个按钮间隔
      const maxPagerCount = Math.floor(screenWidth / (pagerWidth + gapWidth) - 2); // 最大显示的页码数
      console.log(`当前屏幕宽度为 ${screenWidth}，可以显示 ${maxPagerCount} 个页码按钮。`);
      // 设置 pagerCount 的值
      this.pagerCount = maxPagerCount > 8 ? 8 : maxPagerCount; // 最大页码数限制
    },
    // 开始倒计时
    startTimer() {
      const startTime = performance.now();
      const initialTime = this.remainingTime;

      this.timer = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        this.remainingTime = parseFloat((initialTime - elapsed).toFixed(2));

        if (this.remainingTime <= 0) {
          this.remainingTime = 0;
          this.showGameOver = true;
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 10);
    },
    confirmSwitchMode(newMode) {
      // console.log('confirmSwitchMode newMode:', newMode);  // 检查这里传入的 newMode
      if (newMode === this.gameMode) {
        return;
      }

      // 如果游戏正在进行，询问是否切换
      if (this.score === 0) {
        this.switchMode(newMode);  // 确保这里传递了 newMode
        return;
      } else if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      this.$confirm(
        `当前游戏进度将丢失，确认切换到${this.modeTitles[newMode]}吗？`,
        '提示',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 用户选择继续，执行切换操作
        //console.log('用户确认切换，newMode:', newMode);  // 确保 newMode 正确传递
        this.switchMode(newMode);
      }).catch(() => {
        // 用户选择取消，继续计时
        this.startTimer();
      });
    },

    switchMode(newMode) {
      // console.log('switchMode newMode:', newMode);  // 确保 switchMode 接收到 newMode
      // if (newMode === undefined) {
      //   console.error('newMode is undefined in switchMode!');
      //   return;
      // }

      if (this.gameMode === 'timed') {
        this.timed_playing = false;
      }

      this.gameMode = newMode;  // 设置新的游戏模式
      this.restartGame();  // 切换后清空当前数据

      this.$message({
        message: `已切换到${this.modeTitles[this.gameMode]}模式`,
        type: 'success',
        duration: 1500
      });

      this.initLeaderboard();  // 切换模式后重新加载排行榜
    },
    // 处理分页页码切换
    async handlePageChange(page) {
      try {
        // 显示加载动画
        this.loading = this.$loading({
          target: '.custom-pagination',  // 你可以指定哪个元素显示加载动画，通常是整个表格区域
          text: '正在加载...',
          background: 'rgba(255, 255, 255, 0.8)' // 背景透明，确保不挡住内容
        });
        // 更新当前页
        this.currentPage = page;
        // 请求新的分页数据
        await this.getLeaderboard(page);
        // 数据加载完毕后关闭加载动画
        this.loading.close();
      } catch (error) {
        console.error('分页加载失败:', error);
        this.leaderboardError = true;
        if (this.loading) {
          this.loading.close(); // 如果发生错误，也关闭加载动画
        }
      }
    },

    // 生成颜色
    generateColors() {
      const baseHue = Math.random() * 360;
      // 随机决定是加还是减
      const baseSaturation = 50 + (Math.random() > 0.5 ? Math.random() * 30 : -Math.random() * 20);
      const baseLightness = 70 + (Math.random() > 0.5 ? Math.random() * 20 : -Math.random() * 20);

      // 使用非线性公式动态调整差异
      const HueDiff = Math.max(20 / Math.floor(1 + this.level / 5), 5); // 色相差异逐渐趋近 5
      const SaturationDiff = Math.max(15 / Math.floor(1 + this.level / 7), 5); // 饱和度差异逐渐趋近 5
      const LightnessDiff = Math.max(10 / Math.floor(1 + this.level / 9), 2); // 亮度差异逐渐趋近 2

      this.colors = Array(this.totalSquares).fill(0).map(() => {
        return `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`;
      });

      this.targetIndex = Math.floor(Math.random() * this.totalSquares);
      const targetHue = (baseHue + HueDiff) % 360;
      const targetSaturation = baseSaturation + (Math.random() > 0.5 ? SaturationDiff : -SaturationDiff);
      const targetLightness = baseLightness + (Math.random() > 0.5 ? LightnessDiff : -LightnessDiff);

      this.colors[this.targetIndex] = `hsl(${targetHue}, ${targetSaturation}%, ${targetLightness}%)`;
    },

    handleColorClick(index) {
      this.clickedIndex = index;

      if (index === this.targetIndex) {
        // 答对了
        const randomFactor = Math.random() * 3 * Math.floor(this.level / 5); // 随机浮动值
        this.score += Math.floor(8 * (1 + this.level * 0.1) + randomFactor);
        this.nextLevel();
        this.checkAchievements(this.gameMode);
      } else {
        // 答错了 - 游戏结束
        this.showGameOver = true;
        this.saveGameData();
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    },

    nextLevel() {
      this.level++;

      if (this.level === 6) this.gridSize = 3;
      if (this.level === 15) this.gridSize = 4;
      if (this.level === 24) this.gridSize = 5;
      if (this.level === 33) this.gridSize = 6;
      if (this.level === 46) this.gridSize = 7;

      this.generateColors();
    },

    levelToAchievement(level, mode) {
      if (mode === 'timed') {
        if (level >= 2) this.achievements_timed['太慢了'] = true;
        if (level >= 6) this.achievements_timed['慢'] = true;
        if (level >= 10) this.achievements_timed['差点意思'] = true;
        if (level >= 14) this.achievements_timed['还行'] = true;
        if (level >= 19) this.achievements_timed['有点意思'] = true;
        if (level >= 24) this.achievements_timed['哎哟不错哦'] = true;
        if (level >= 29) this.achievements_timed['渐入佳境'] = true;
        if (level >= 34) this.achievements_timed['眼感火热'] = true;
        if (level >= 39) this.achievements_timed['电眼逼人'] = true;
        if (level >= 45) this.achievements_timed['唯快不破'] = true;
        if (level >= 50) this.achievements_timed['3090'] = true;
        if (level >= 55) this.achievements_timed['4060'] = true;
        if (level >= 60) this.achievements_timed['4090'] = true;
        if (level >= 65) this.achievements_timed['A100'] = true;
      }
      else if (mode === "normal") {
        if (level >= 2) this.achievements['色盲'] = true;
        if (level >= 3) this.achievements['色弱'] = true;
        if (level >= 5) this.achievements['肉眼凡胎'] = true;
        if (level >= 8) this.achievements['一眼丁真'] = true;
        if (level >= 10) this.achievements['目光犀利'] = true;
        if (level >= 12) this.achievements['初出茅庐'] = true;
        if (level >= 14) this.achievements['火眼初成'] = true;
        if (level >= 17) this.achievements['锋芒毕露'] = true;
        if (level >= 21) this.achievements['成绩斐然'] = true;
        if (level >= 25) this.achievements['得心应手'] = true;
        if (level >= 30) this.achievements['游刃有余'] = true;
        if (level >= 35) this.achievements['炉火纯青'] = true;
        if (level >= 40) this.achievements['登峰造极'] = true;
        if (level >= 47) this.achievements['出神入化'] = true;
        if (level >= 52) this.achievements['绝世无双'] = true;
        if (level >= 60) this.achievements['绝世无双-Pro'] = true;
        if (level >= 70) this.achievements['绝世无双-Ultra'] = true;
        if (level >= 80) this.achievements['绝世无双-Plus'] = true;
        if (level >= 90) this.achievements['绝世无双-Max'] = true;
        if (level >= 100) this.achievements['绝世无双-Pro-Max'] = true;
        if (level >= 110) this.achievements['绝世无双-Ultra-Pro-Max'] = true;
        if (level >= 120) this.achievements['绝世无双-Plus-Ultra-Pro-Max'] = true;
        if (level >= 120) this.achievements['淬体境'] = true;
        if (level >= 130) this.achievements['聚气境'] = true;
        if (level >= 140) this.achievements['蜕凡境'] = true;
        if (level >= 150) this.achievements['人元境'] = true;
        if (level >= 160) this.achievements['真阳境'] = true;
        if (level >= 170) this.achievements['灵武境'] = true;
        if (level >= 180) this.achievements['天罡境'] = true;
        if (level >= 190) this.achievements['玄冥境'] = true;
        if (level >= 200) this.achievements['化宗境'] = true;
        if (level >= 210) this.achievements['虚空境'] = true;
        if (level >= 220) this.achievements['洞虚境'] = true;
        if (level >= 230) this.achievements['阴阳境'] = true;
        if (level >= 240) this.achievements['四极境'] = true;
        if (level >= 250) this.achievements['轮回境'] = true;
        if (level >= 260) this.achievements['大武境'] = true;
        if (level >= 270) this.achievements['王者境'] = true;
        if (level >= 280) this.achievements['元尊境'] = true;
        if (level >= 290) this.achievements['至尊境'] = true;
        if (level >= 305) this.achievements['主宰境'] = true;
        if (level >= 320) this.achievements['皇者境'] = true;
        if (level >= 335) this.achievements['天王境'] = true;
        if (level >= 350) this.achievements['界王境'] = true;
        if (level >= 365) this.achievements['破天境'] = true;
        if (level >= 385) this.achievements['合天境'] = true;
        if (level >= 410) this.achievements['融天境'] = true;
        if (level >= 440) this.achievements['原神启动境'] = true;
      }
      else if (mode === "open") {
        return;
      }
    },

    checkAchievements(mode) {
      var previousAchievements = {}
      if (mode === 'timed') {
        previousAchievements = { ...this.achievements_timed };
      } else {
        previousAchievements = { ...this.achievements };
      }
      const level = this.level;
      this.levelToAchievement(level, mode);
      if (mode === 'timed') {
        this.showachieve(this.achievements_timed, previousAchievements);
      } else {
        this.showachieve(this.achievements, previousAchievements);
      }
    },
    // 检查新解锁的成就
    showachieve(achievement, previousAchievements) {
      Object.entries(achievement).forEach(([title, achieved]) => {
        if (achieved && !previousAchievements[title]) {
          this.currentAchievement = title;
          console.log('解锁成就:', title);
          // 3秒后清除成就提示
          setTimeout(() => {
            if (this.currentAchievement === title) {
              this.currentAchievement = '';
            }
          }, 2200);
        }
      });
    },

    saveGameData() {
      //本地存储轮数和分数
      if (this.gameMode === 'timed') {
        if (this.level > this.maxLevelTimed) {
          this.maxLevelTimed = this.level;
          localStorage.setItem('maxLevelTimed', this.maxLevelTimed);
        }
        if (this.score > this.maxScoreTimed) {
          this.maxScoreTimed = this.score;
          localStorage.setItem('maxScoreTimed', this.maxScoreTimed);
        }
      }
      if (this.gameMode === 'normal') {
        if (this.level > this.maxLevel) {
          this.maxLevel = this.level;
          localStorage.setItem('maxLevel', this.maxLevel);
        }
        if (this.score > this.maxScore) {
          this.maxScore = this.score;
          localStorage.setItem('maxScore', this.maxScore);
        }
      }
    },

    loadGameData() {
      const savedMaxLevelTimed = localStorage.getItem('maxLevelTimed');
      if (savedMaxLevelTimed) {
        this.maxLevelTimed = parseInt(savedMaxLevelTimed, 10);
      }
      const savedMaxScoreTimed = localStorage.getItem('maxScoreTimed');
      if (savedMaxScoreTimed) {
        this.maxScoreTimed = parseInt(savedMaxScoreTimed, 10);
      }
      const savedMaxLevel = localStorage.getItem('maxLevel');
      if (savedMaxLevel) {
        this.maxLevel = parseInt(savedMaxLevel, 10);
      }
      const savedMaxScore = localStorage.getItem('maxScore');
      if (savedMaxScore) {
        this.maxScore = parseInt(savedMaxScore, 10);
      }
      this.levelToAchievement(this.maxLevel, "normal");
      this.levelToAchievement(this.maxLevelTimed, "timed");
      console.log('本地成就信息:', this.achievements);
    },

    restartGame() {
      this.score = 0;
      this.level = 1;
      this.gridSize = 2;
      this.currentAchievement = '';
      this.showGameOver = false;
      this.generateColors();
      clearInterval(this.timer);
      this.timer = null;
      this.remainingTime = 60; // 重置倒计时
      this.timed_playing = false;
    },

    async initLeaderboard() {
      this.currentPage = 1; // 重置当前页数
      try {
        // 直接加载第一页数据
        await this.getLeaderboard(this.currentPage); // 加载第一页数据
      } catch (error) {
        console.error('初始化排行榜失败:', error);
        this.leaderboardError = true;
      }
    },

    // 获取指定页的排行榜数据
    async getLeaderboard(page) {
      try {
        const response = await axiosRequest.post('/get_colorgame_ranking/', {
          page: page,
          page_size: this.pageSize,
          mode: this.gameMode
        });
        const data = response.data;
        if (data.status === 200) {
          this.$message({
            message: '排行榜数据已更新',
            type: 'success',
            duration: 1500
          });
          // 赋值总用户数
          this.totalUsers = data.data.total_users;
          this.leaderboardData = data.data.ranks; // 当前页数据
          this.leaderboardError = false;         // 请求成功，重置错误状态
        }
      } catch (error) {
        this.$message.error('获取排行榜数据失败');
        console.error(`获取第 ${page} 页数据失败:`, error);
        this.leaderboardError = true; // 请求失败，设置错误状态
      }
    },

    //上传分数 
    async submitScore() {
      this.$refs.uploadForm.validate(async (valid) => {
        if (valid) {
          try {
            // 检查用户名是否已被使用
            //console.log(this.uploadForm.username);
            const checkResponse = await axiosRequest({
              method: 'post',
              url: '/check_colorgame_username/',
              data: {
                username: this.uploadForm.username,
                mode: this.gameMode
              }
            });
            if (checkResponse.data.status === 400) {
              // 用户名已存在，提示用户是否继续
              this.$confirm('用户名已存在，是否继续使用该用户名上传分数？', '提示', {
                confirmButtonText: '继续',
                cancelButtonText: '取消',
                type: 'warning',
                closeOnClickModal: false
              }).then(() => {
                // 用户选择继续，执行上传操作
                this.uploadScore();
              }).catch(() => {
                // 用户选择取消，不执行任何操作
                this.$message.info('已取消上传');
              });
            }
            else if (checkResponse.data.status === 500) {
              const error = checkResponse.data.error_msg;
              this.$confirm(error, '提示', {
                confirmButtonText: '继续',
                cancelButtonText: '取消',
                type: 'error',
                closeOnClickModal: false
              }).then(() => {
                this.$message.info('已取消上传');
              }).catch(() => {
                // 用户选择取消，不执行任何操作
                this.$message.info('已取消上传');
              });
            }
            else {
              // 新建用户名，提示用户确定使用这个创建吗
              this.$confirm(`确定使用${this.uploadForm.username}作为用户名上传分数吗？`, '提示', {
                confirmButtonText: '继续',
                cancelButtonText: '取消',
                type: 'warning',
                closeOnClickModal: false
              }).then(() => {
                // 用户选择继续，执行上传操作
                this.uploadScore();
              }).catch(() => {
                // 用户选择取消，不执行任何操作
                this.$message.info('已取消上传');
              });
            }
          } catch (error) {
            console.error('检查用户名失败:', error);
            this.$message.error('获取用户数据失败，请检查网络');
          }
        }
      });
    },

    async uploadScore() {
      try {
        const response = await axiosRequest({
          method: 'post',
          url: '/upload_colorgame_scores/',
          data: {
            username: this.uploadForm.username,
            score: this.score,
            level: this.level,
            mode: this.gameMode
          },
        });
        const data = response.data;

        if (data.status === 200) {
          localStorage.setItem('username', this.uploadForm.username); // 保存用户名
          this.currentRank = data.data.user_rank;                     // 更新当前用户排名
          this.isBreakRecord = data.data.is_break_record;             // 是否破纪录
          this.totalUsers = data.data.total_users;                    // 更新总用户数
          this.showUploadDialog = false;
          this.showRankResult = true;

          // 刷新当前页排行榜
          this.initLeaderboard();
        }
      } catch (error) {
        console.error('上传分数失败:', error);
        this.$message.error('上传分数失败，请重试');
      }
    },

    refreshLeaderboard() {
      this.initLeaderboard();
    },

    showUploadScore() {
      this.showUploadDialog = true;
    },

    setRowClassName({ row }) {
      const currentUsername = localStorage.getItem('username');
      return row.username === currentUsername ? 'current-user-row' : '';
    },

    getRankClass(rank) {
      if (rank === 1) return 'rank-first';
      if (rank === 2) return 'rank-second';
      if (rank === 3) return 'rank-third';
      return '';
    },
  },
};
</script>

<style scoped>
.color-game {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(to bottom, #4527A0, #7B1FA2, #C2185B);
  /* Disable text selection */
  user-select: none;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  /* 允许换行 */
}

.score {
  margin-top: 10px;
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.timer {
  position: absolute;
  top: 120px;
  right: 10%;
  font-size: 35px;
  color: white;
}

.timer-display {
  font-family: monospace;
  font-weight: bold;
  min-width: 70px;
  display: inline-block;
  text-align: center;
}

.game-container {
  display: grid;
  gap: 10px;
  width: var(--container-width, 100%);
  max-width: 400px;
  margin: 0 auto 20px;
  aspect-ratio: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  margin-top: 30px;
}

.color-block {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.color-block:hover {
  transform: scale(0.98);
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  /* 允许换行 */
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-tag {
  margin: 5px;
}

.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  animation: slideIn 0.5s ease-out;
}

.final-score {
  font-size: 21px;
  text-align: center;
  margin-bottom: 20px;
}

.achievements-earned {
  margin-top: 20px;
}

.achievements-earned h3 {
  margin-bottom: 10px;
}

.max-level-display {
  bottom: 20px;
  left: 20px;
  font-size: 18px;
  color: white;
  margin-top: 20px;
  margin-left: 3%;
}

.leaderboard {
  margin: auto;
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  width: 65%;
}

.leaderboard-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 30px;
  margin-top: 15px;
}

.leaderboard-title {
  color: white;
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
}

.current-user-row {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

.rank-number {
  font-weight: bold;
  width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 50%;
  margin: 0 auto;
}

.rank-first {
  background-color: #FFD700;
  color: #000;
}

.rank-second {
  background-color: #C0C0C0;
  color: #000;
}

.rank-third {
  background-color: #CD7F32;
  color: #000;
}

.refresh-btn {
  color: white;
}

.rank-result {
  text-align: center;
  font-size: 18px;
}

.highlight {
  color: #409EFF;
  font-size: 24px;
  font-weight: bold;
}

.break-record {
  color: #67C23A;
  font-size: 20px;
  margin-top: 10px;
}

.mode-selector button {
  margin: 5px;
}

.mode-selector .active {
  font-weight: bold;
  color: blue;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 新增媒体查询 */
@media (max-width: 550px) {
  .timer {
    position: absolute;
    top: 130px;
    right: 6%;
    font-size: 25px;
    color: white;
  }

  .score {
    font-size: 20px;
    margin-top: 10px;
  }

  .game-container {
    padding: 10px;
    gap: 5px;
    width: 90%;
    margin-top: 20px;
  }

  .color-block {
    border-radius: 4px;
  }

  .game-controls {
    gap: 10px;
  }

  .final-score {
    font-size: 18px;
  }

  .max-level-display {
    font-size: 16px;
  }

  .leaderboard {
    /* 上右下左 */
    margin: auto;
    width: 100%;
    padding: 6px;
    margin-left: -6px;
  }

  .leaderboard-title {
    font-size: 20px;
  }

  .el-table {
    font-size: 12px;
  }
}
</style>

<style>
.reward-width,
.gameover-width {
  width: 35%;
}

/* 分页器容器 */
.custom-pagination {
  display: inline-block;
  font-size: 14px;
  color: #4527A0;
}

.el-pagination button {
  height: 36px !important;
  line-height: 36px !important;
  border-radius: 6px;
}

/* 页码按钮 */
.custom-pagination .el-pager li {
  font-size: 16px;
  font-weight: bold;
  color: #4527A0;
  border-radius: 50%;
  width: 36px;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  margin: 0 5px;
  transition: background-color 0.3s, color 0.3s;
}

/* 当前页码按钮 */
.custom-pagination .el-pager li.active {
  background-color: #4527A0;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 悬停效果 */
.custom-pagination .el-pager li:hover {
  background-color: #6A52C4;
  color: white;
}

/* 上一页、下一页按钮 */
.custom-pagination .el-pagination__prev,
.custom-pagination .el-pagination__next {
  font-size: 16px;
  color: #4527A0;
  transition: color 0.3s;
  border-radius: 15px;
}

.custom-pagination .el-pagination__prev:hover,
.custom-pagination .el-pagination__next:hover {
  color: #6A52C4;
}

/* 禁用状态按钮 */
.custom-pagination .el-pagination__prev.is-disabled,
.custom-pagination .el-pagination__next.is-disabled {
  color: #B0B0B0;
}

/* 简化页码符号（...） */
.custom-pagination .el-pager li.more {
  font-size: 18px;
  font-weight: bold;
  color: #B0B0B0;
  cursor: default;
}

@media (max-width: 550px) {

  .reward-width,
  .gameover-width {
    width: 80%;
    border-radius: 15px;
  }

  .custom-pagination .el-pager li {
    width: 30px;
    min-width: 30px;
    height: 30px;
    line-height: 30px;
    margin: 0 2px;
  }

  .el-pagination button {
    height: 30px !important;
    line-height: 30px !important;
    border-radius: 6px;
  }
}
</style>