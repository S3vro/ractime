<template>
  <div class="container dashboard-page">
    <h1 class="page-title">📊 Dashboard</h1>

    <!-- Active task / Start task -->
    <section class="timer-section glass-card" id="timer-section">
      <!-- Running state -->
      <div v-if="activeTask" class="timer-running">
        <div class="timer-pulse" :style="{ background: activeCategory?.color ?? '#4CAF50' }"></div>
        <div class="timer-info">
          <span class="timer-task-name">{{ activeTask.name }}</span>
          <span class="timer-category" v-if="activeCategory">
            <span class="timer-cat-dot" :style="{ background: activeCategory.color }"></span>
            {{ activeCategory.name }}
          </span>
        </div>
        <div class="timer-clock">{{ elapsed }}</div>
        <button class="btn btn-danger" id="stop-task-btn" @click="handleStop">
          ⏹ Stop
        </button>
      </div>

      <!-- Idle state -->
      <div v-else class="timer-idle">
        <p class="timer-idle-text">No task running</p>
        <button class="btn btn-primary" id="start-task-btn" @click="showForm = !showForm">
          {{ showForm ? 'Cancel' : '▶ Start Task' }}
        </button>
      </div>

      <!-- Start form (inline) -->
      <transition name="slide">
        <form v-if="showForm && !activeTask" class="start-form" @submit.prevent="handleStart" id="start-task-form">
          <input
            v-model="taskName"
            type="text"
            class="input"
            placeholder="Task name…"
            id="task-name-input"
            required
          />
          <input
            v-model="taskDesc"
            type="text"
            class="input"
            placeholder="Description (optional)"
            id="task-desc-input"
          />
          <select v-model="taskCategory" class="input select" id="task-category-select" required>
            <option value="" disabled>Select category…</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <button type="submit" class="btn btn-primary" id="submit-task-btn">
            ▶ Go
          </button>
        </form>
      </transition>
    </section>

    <!-- Charts row -->
    <div class="charts-row">
      <section class="chart-section glass-card" id="gantt-section">
        <h2 class="chart-title">Today's Timeline</h2>
        <GanttChart />
      </section>
      <section class="chart-section glass-card" id="pie-section">
        <h2 class="chart-title">This Week</h2>
        <PieChart />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getActiveTask,
  getActiveTaskMeta,
  getCategories,
  getCategoryById,
  startTask,
  stopTask,
} from '../stores/storage.js'
import GanttChart from '../components/GanttChart.vue'
import PieChart from '../components/PieChart.vue'

const categories = getCategories()
const activeTask = computed(() => getActiveTask())
const activeCategory = computed(() =>
  activeTask.value ? getCategoryById(activeTask.value.categoryId) : null
)

const showForm = ref(false)
const taskName = ref('')
const taskDesc = ref('')
const taskCategory = ref('')

// Elapsed timer
const elapsed = ref('00:00:00')
let timerInterval = null

function updateElapsed() {
  const meta = getActiveTaskMeta()
  if (!meta) { elapsed.value = '00:00:00'; return }
  const diff = Math.floor((Date.now() - meta.startedAt) / 1000)
  const h = String(Math.floor(diff / 3600)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
  const s = String(diff % 60).padStart(2, '0')
  elapsed.value = `${h}:${m}:${s}`
}

onMounted(() => {
  updateElapsed()
  timerInterval = setInterval(updateElapsed, 1000)
})
onUnmounted(() => clearInterval(timerInterval))

function handleStart() {
  if (!taskName.value.trim() || !taskCategory.value) return
  startTask(taskName.value.trim(), taskDesc.value.trim(), taskCategory.value)
  taskName.value = ''
  taskDesc.value = ''
  taskCategory.value = ''
  showForm.value = false
}

function handleStop() {
  stopTask()
}
</script>

<style scoped>
.dashboard-page {
  animation: slideUp var(--transition-slow) both;
}

/* ── Timer Section ────────────── */
.timer-section {
  margin-bottom: var(--sp-lg);
}

.timer-running {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  flex-wrap: wrap;
}

.timer-pulse {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  animation: pulse 1.5s infinite;
  flex-shrink: 0;
}

.timer-info {
  flex: 1;
  min-width: 120px;
}

.timer-task-name {
  font-weight: 700;
  font-size: 1.1rem;
  display: block;
}

.timer-category {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  color: var(--clr-text-muted);
  font-size: 0.82rem;
}

.timer-cat-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.timer-clock {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--clr-accent);
  min-width: 130px;
  text-align: right;
}

.timer-idle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-idle-text {
  color: var(--clr-text-muted);
  font-size: 0.95rem;
}

/* Start form */
.start-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-sm);
  margin-top: var(--sp-md);
  padding-top: var(--sp-md);
  border-top: 1px solid var(--clr-border);
}

.start-form .input,
.start-form .select {
  flex: 1 1 180px;
}

/* ── Charts ───────────────────── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
}

.chart-section {
  min-height: 200px;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--sp-md);
  color: var(--clr-cream-dim);
}

@media (max-width: 768px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .timer-clock { font-size: 1.3rem; min-width: auto; }
  .timer-running { gap: var(--sp-sm); }
}
</style>
