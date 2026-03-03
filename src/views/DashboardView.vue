<template>
  <div class="container dashboard-page">
    <h1 class="page-title">
      <BarChart3 :size="28" />
      Dashboard
    </h1>

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
          <Square :size="14" />
          Stop
        </button>
      </div>

      <!-- Idle state -->
      <div v-else class="timer-idle">
        <img src="/icon.png" alt="Ractime raccoon" class="idle-hero" />
        <p class="timer-idle-text">No task running</p>
        <button class="btn btn-primary" id="start-task-btn" @click="showForm = !showForm">
          <component :is="showForm ? X : Play" :size="14" />
          {{ showForm ? 'Cancel' : 'Start Task' }}
        </button>

        <!-- Quick-start from queue -->
        <div v-if="queuedTasks.length > 0 && !showForm" class="quick-start">
          <span class="quick-start-label">or pick from queue</span>
          <div class="quick-start-list">
            <button
              v-for="qt in queuedTasks"
              :key="qt.id"
              class="quick-start-btn"
              :id="'quick-start-' + qt.id"
              @click="handleQuickStart(qt)"
            >
              <span class="qs-dot" :style="{ background: getCategoryById(qt.categoryId)?.color ?? '#5C5C78' }"></span>
              <span class="qs-name">{{ qt.name }}</span>
              <Play :size="12" class="qs-play" />
            </button>
          </div>
        </div>
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
            <Play :size="14" />
            Go
          </button>
        </form>
      </transition>
    </section>

    <!-- Stats row -->
    <div class="stats-row">
      <section class="stat-card glass-card" id="week-hours-card">
        <span class="stat-label"><Clock :size="16" /> Hours This Week</span>
        <span class="stat-value">{{ weekHoursFormatted }}</span>
      </section>
      <section class="stat-card glass-card" id="avg-hours-card">
        <span class="stat-label"><TrendingUp :size="16" /> Avg Hours / Day</span>
        <span class="stat-value">{{ avgHoursFormatted }}</span>
      </section>
    </div>

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
import { Play, Square, X, BarChart3, Clock, TrendingUp } from 'lucide-vue-next'
import {
  getActiveTask,
  getActiveTaskMeta,
  getCategories,
  getCategoryById,
  startTask,
  stopTask,
  getQueuedTasks,
  startQueuedTask,
  getWeekTotalMs,
  getWeekAvgMsPerDay,
} from '../stores/storage.js'
import GanttChart from '../components/GanttChart.vue'
import PieChart from '../components/PieChart.vue'

const categories = getCategories()
const queuedTasks = getQueuedTasks()
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

// Week-stats polling
const statsTick = ref(Date.now())
let statsInterval = null

function formatMs(ms) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}

const weekHoursFormatted = computed(() => {
  void statsTick.value
  return formatMs(getWeekTotalMs())
})

const avgHoursFormatted = computed(() => {
  void statsTick.value
  return formatMs(getWeekAvgMsPerDay())
})

onMounted(() => {
  updateElapsed()
  statsInterval = setInterval(() => { statsTick.value = Date.now() }, 60000)
  timerInterval = setInterval(updateElapsed, 1000)
})
onUnmounted(() => {
  clearInterval(timerInterval)
  clearInterval(statsInterval)
})

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

function handleQuickStart(qt) {
  startQueuedTask(qt.id)
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
  flex-direction: column;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-lg) 0;
}

.idle-hero {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  filter: drop-shadow(0 0 24px rgba(76, 175, 80, 0.2));
  animation: fadeIn var(--transition-slow) both;
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

/* ── Stats Row ────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
  margin-bottom: var(--sp-lg);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-sm);
  padding: var(--sp-xl) var(--sp-lg);
  text-align: center;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--clr-accent);
  letter-spacing: 0.02em;
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
  .stats-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .timer-clock { font-size: 1.3rem; min-width: auto; }
  .timer-running { gap: var(--sp-sm); }
  .stat-value { font-size: 1.8rem; }
}

/* ── Quick Start ─────────────── */
.quick-start {
  width: 100%;
  margin-top: var(--sp-md);
  padding-top: var(--sp-md);
  border-top: 1px solid var(--clr-border);
  text-align: center;
}

.quick-start-label {
  display: block;
  font-size: 0.8rem;
  color: var(--clr-text-muted);
  margin-bottom: var(--sp-sm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.quick-start-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  justify-content: center;
}

.quick-start-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-xs) var(--sp-md);
  background: var(--clr-surface);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-full);
  color: var(--clr-cream);
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.quick-start-btn:hover {
  background: var(--clr-surface-hover);
  border-color: var(--clr-accent);
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.15);
}

.quick-start-btn:active {
  transform: scale(0.97);
}

.qs-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.qs-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qs-play {
  color: var(--clr-accent);
  flex-shrink: 0;
}
</style>
