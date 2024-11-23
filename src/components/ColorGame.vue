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

    <!-- 游戏结束对话框 -->
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
        <el-button type="primary" @click="restartGame">重新开始</el-button>
      </span>
    </el-dialog>
    <!-- 显示最大轮数 -->
    <div class="max-level-display">
      <p>最大轮数: {{ maxLevel }}</p>
      <p>最高分: {{ maxScore }}</p>
    </div>
  </div>
</template>

<script>
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
    };
  },
  created() {
    this.loadGameData();
    this.generateColors();
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
        this.score += Math.floor(10 * (1 + this.level * 0.1));
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
          }, 2500);
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

.reward-width,
.gameover-width {
  width: 30%;
}

/* 新增媒体查询 */
@media (max-width: 550px) {

  .reward-width,
  .gameover-width {
    width: 85%;
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
}
</style>