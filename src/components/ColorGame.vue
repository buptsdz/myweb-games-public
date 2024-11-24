<template>
  <div class="color-game">
    <!-- 分数和成就显示 -->
    <div class="game-header">
      <div class="score">分数: {{ score }}</div>
      <div v-if="currentAchievement" class="achievement-notification">
        <el-alert :title="`解锁成就：${currentAchievement}`" type="success" :closable="false" show-icon />
      </div>
    </div>

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
      <div class="achievements-list">
        <el-tag v-for="(achieved, title) in achievements" :key="title" :type="achieved ? 'success' : 'info'"
          class="achievement-tag">
          {{ title }}
        </el-tag>
      </div>
    </el-dialog>

    <!-- 修改后的游戏结束对话框 -->
    <el-dialog title="游戏结束" :visible.sync="showGameOver" customClass="gameover-width" @close="restartGame"
      :close-on-click-modal="false">
      <div class="game-over-content">
        <p class="final-score">你到达了第<span style="color: rgb(232, 101, 39)"> {{ level }} </span>关 </p>
        <p class="final-score">获得了<span style="color: rgb(50,225,50)"> {{ score }} </span>分！</p>
        <div class="achievements-earned">
          <h3>已获得成就：</h3>
          <el-tag :style="{ display: achieved ? 'inline-block' : 'none' }" v-for="(achieved, title) in achievements"
            :key="title" type="success" class="achievement-tag">
            {{ title }}
          </el-tag>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showUploadScore">上传分数</el-button>
        <el-button @click="restartGame">重新开始</el-button>
      </span>
    </el-dialog>

    <!-- 上传分数对话框 -->
    <el-dialog title="上传分数" :visible.sync="showUploadDialog" customClass="gameover-width" :close-on-click-modal="false">
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadForm">
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
        <p>恭喜！您当前排名第 <span class="highlight">{{ currentRank }}</span> 名</p>
        <p v-if="isBreakRecord" class="break-record">新纪录！</p>
      </div>
    </el-dialog>

    <!-- 显示最大轮数 -->
    <div class="max-level-display">
      <p>最大轮数: {{ maxLevel }}</p>
      <p>最高分: {{ maxScore }}</p>
    </div>

    <!-- 排行榜 -->
    <div class="leaderboard">
      <h2 class="leaderboard-title">排行榜</h2>
      <el-table :data="leaderboardData" style="width: 100%"
        :header-cell-style="{ background: '#4527A0', color: 'white' }" :row-class-name="setRowClassName"
        :empty-text="leaderboardError ? '获取排行数据失败' : '暂时无人挑战，快来留下你的战绩吧'">
        <el-table-column prop="rank" label="排名" width="80" align="center">
          <template slot-scope="scope">
            <div class="rank-number" :class="getRankClass(scope.row.rank)">
              {{ scope.row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="max_score" label="分数" width="100"></el-table-column>
        <el-table-column prop="record_broken_at" label="破纪录时间" width="180"></el-table-column>
      </el-table>
      <el-button type="text" class="refresh-btn" @click="refreshLeaderboard">
        <i class="el-icon-refresh"></i> 刷新排行榜
      </el-button>
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
        '初出茅庐': false,
        '火眼初成': false,
        '初试锋芒': false,
        '成绩斐然': false,
        '得心应手': false,
        '游刃有余': false,
        '炉火纯青': false,
        '登峰造极': false,
        '出神入化': false,
        '绝世无双': false,
      },
      maxLevel: 1,
      maxScore: 0,
      showUploadDialog: false,
      showRankResult: false,
      leaderboardData: [],
      leaderboardError: false, // 排行榜获取状态
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
    };
  },
  created() {
    this.loadGameData();
    this.generateColors();
    this.getLeaderboard(); // 获取初始排行榜数据
  },
  computed: {
    totalSquares() {
      return this.gridSize * this.gridSize;
    },
    gridStyle() {
      const containerWidth = 300 + this.gridSize * 0.2 * 100;

      return {
        '--grid-size': this.gridSize,
        '--container-width': `${containerWidth}px`,
        gridTemplateColumns: `repeat(${this.gridSize}, 1fr)`
      };
    },
  },

  methods: {
    generateColors() {
      const baseHue = Math.random() * 360;
      const baseSaturation = 70 + Math.random() * 20;
      const baseLightness = 50 + Math.random() * 20;

      const hueDiff = Math.max(20 - this.level, 5);

      this.colors = Array(this.totalSquares).fill(0).map(() => {
        return `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`;
      });

      this.targetIndex = Math.floor(Math.random() * this.totalSquares);
      const targetHue = (baseHue + hueDiff) % 360;
      this.colors[this.targetIndex] = `hsl(${targetHue}, ${baseSaturation}%, ${baseLightness}%)`;
    },

    handleColorClick(index) {
      this.clickedIndex = index;

      if (index === this.targetIndex) {
        // 答对了
        const randomFactor = Math.random() * 3 * Math.floor(this.level / 5); // 随机浮动值
        this.score += Math.floor(8 * (1 + this.level * 0.1) + randomFactor);
        this.nextLevel();
        this.checkAchievements();
      } else {
        // 答错了 - 游戏结束
        this.showGameOver = true;
        this.saveGameData();
      }
    },

    nextLevel() {
      this.level++;

      if (this.level === 6) this.gridSize = 3;
      if (this.level === 14) this.gridSize = 4;
      if (this.level === 22) this.gridSize = 5;
      if (this.level === 30) this.gridSize = 6;
      if (this.level === 42) this.gridSize = 7;

      this.generateColors();
    },

    checkAchievements() {
      const previousAchievements = { ...this.achievements };

      if (this.level >= 2) this.achievements['初出茅庐'] = true;
      if (this.level >= 6) this.achievements['火眼初成'] = true;
      if (this.level >= 10) this.achievements['初试锋芒'] = true;
      if (this.level >= 15) this.achievements['成绩斐然'] = true;
      if (this.level >= 20) this.achievements['得心应手'] = true;
      if (this.level >= 25) this.achievements['游刃有余'] = true;
      if (this.level >= 30) this.achievements['炉火纯青'] = true;
      if (this.level >= 35) this.achievements['登峰造极'] = true;
      if (this.level >= 40) this.achievements['出神入化'] = true;
      if (this.level >= 50) this.achievements['绝世无双'] = true;

      // 检查新解锁的成就
      Object.entries(this.achievements).forEach(([title, achieved]) => {
        if (achieved && !previousAchievements[title]) {
          this.currentAchievement = title;
          // 3秒后清除成就提示
          setTimeout(() => {
            if (this.currentAchievement === title) {
              this.currentAchievement = '';
            }
          }, 3300);
        }
      });
    },

    saveGameData() {
      const gameData = {
        achievements: this.achievements,
      };
      localStorage.setItem('colorGameData', JSON.stringify(gameData));

      // 更新最大轮数
      if (this.level > this.maxLevel) {
        this.maxLevel = this.level;
        localStorage.setItem('maxLevel', this.maxLevel);
      }
      if (this.score > this.maxScore) {
        this.maxScore = this.score;
        localStorage.setItem('maxScore', this.maxScore);
      }
    },

    loadGameData() {
      const savedData = localStorage.getItem('colorGameData');
      if (savedData) {
        const { achievements } = JSON.parse(savedData);
        this.achievements = achievements;
      }

      const savedMaxLevel = localStorage.getItem('maxLevel');
      if (savedMaxLevel) {
        this.maxLevel = parseInt(savedMaxLevel, 10);
      }
      const savedMaxScore = localStorage.getItem('maxScore');
      if (savedMaxScore) {
        this.maxScore = parseInt(savedMaxScore, 10);
      }
    },

    restartGame() {
      this.score = 0;
      this.level = 1;
      this.gridSize = 2;
      this.currentAchievement = '';
      this.showGameOver = false;
      this.generateColors();
    },

    //获得排行榜数据  
    async getLeaderboard() {
      try {
        const response = await axiosRequest.get('/get_colorgame_ranking/');
        const data = response.data;
        if (data.status === 200) {
          this.leaderboardData = data.data.top_ranks;
          this.totalUsers = data.data.total_users;
          this.leaderboardError = false; // 请求成功，重置错误状态
          this.$message.success('排行榜已更新');
        }
      } catch (error) {
        console.error('获取排行榜失败:', error);
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
                username: this.uploadForm.username
              }
            });
            if (checkResponse.data.status === 400) {
              // 用户名已存在，提示用户是否继续
              this.$confirm('用户名已存在，是否继续使用该用户名上传分数？', '提示', {
                confirmButtonText: '继续',
                cancelButtonText: '取消',
                type: 'warning'
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
                type: 'error'
              }).then(() => {
                this.$message.info('已取消上传');
              }).catch(() => {
                // 用户选择取消，不执行任何操作
                this.$message.info('已取消上传');
              });
            }
            else {
              // 用户名不存在，直接上传
              this.uploadScore();
            }
          } catch (error) {
            console.error('检查用户名失败:', error);
            this.$message.error('检查用户名失败，请重试');
          }
        }
      });
    },

    async uploadScore() {
      try {
        const response = await axiosRequest({
          method: 'post',
          url: '/post_colorgame_ranking/',
          data: {
            'username': this.uploadForm.username,
            'score': this.score,
            'level': this.level
          }
        });
        const data = response.data;

        if (data.status === 200) {
          localStorage.setItem('username', this.uploadForm.username);
          this.currentRank = data.data.user_rank;
          this.isBreakRecord = data.data.is_break_record;
          this.showUploadDialog = false;
          this.showRankResult = true;
          this.getLeaderboard(); // 刷新排行榜
        }
      } catch (error) {
        console.error('上传分数失败:', error);
        this.$message.error('上传分数失败，请重试');
      }
    },

    refreshLeaderboard() {
      this.getLeaderboard();
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
    }
  },
};
</script>

<style>
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
  font-size: 24px;
  font-weight: bold;
  color: white;
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
  margin-top: 10px;
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

.reward-width,
.gameover-width {
  width: 35%;
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

  .reward-width,
  .gameover-width {
    width: 80%;
    border-radius: 15px;
  }

  .score {
    font-size: 18px;
  }

  .game-container {
    padding: 10px;
    gap: 5px;
    width: 90%;
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