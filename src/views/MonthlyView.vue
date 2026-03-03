<template>
  <div class="container monthly-page">
    <h1 class="page-title">
      <CalendarDays :size="28" />
      Monthly Overview
    </h1>

    <!-- Month picker -->
    <div class="month-picker glass-card" id="month-picker">
      <button class="btn btn-secondary btn-icon" id="month-prev" @click="prevMonth">
        <ChevronLeft :size="18" />
      </button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="btn btn-secondary btn-icon" id="month-next" @click="nextMonth" :disabled="isCurrentMonth">
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Total hours card -->
    <section class="month-total glass-card" id="month-total-card">
      <span class="month-total-label"><Clock :size="16" /> Total Hours</span>
      <span class="month-total-value">{{ totalFormatted }}</span>
    </section>

    <!-- Category breakdown -->
    <section class="breakdown glass-card" id="category-breakdown">
      <h2 class="chart-title">Category Breakdown</h2>

      <div v-if="breakdown.length > 0" class="breakdown-list">
        <div
          v-for="item in breakdown"
          :key="item.categoryId"
          class="breakdown-item"
        >
          <div class="breakdown-bar-wrapper">
            <span class="breakdown-cat">
              <span class="breakdown-dot" :style="{ background: item.color }"></span>
              {{ item.name }}
            </span>
            <span class="breakdown-hours">{{ item.formatted }}</span>
          </div>
          <div class="breakdown-bar-bg">
            <div
              class="breakdown-bar-fill"
              :style="{ width: item.pct + '%', background: item.color }"
            ></div>
          </div>
        </div>
      </div>

      <p v-else class="breakdown-empty">No data for this month — track some time!</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next'
import { getEntriesForMonth, getCategoryById } from '../stores/storage.js'

const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth()) // 0-indexed

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const monthLabel = computed(() => `${MONTH_NAMES[selectedMonth.value]} ${selectedYear.value}`)

const isCurrentMonth = computed(() =>
  selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth()
)

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

const monthData = computed(() => getEntriesForMonth(selectedYear.value, selectedMonth.value))

const totalMs = computed(() => {
  let sum = 0
  for (const ms of Object.values(monthData.value)) sum += ms
  return sum
})

function formatMs(ms) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}

const totalFormatted = computed(() => formatMs(totalMs.value))

const breakdown = computed(() => {
  const entries = monthData.value
  const items = []
  const max = Math.max(...Object.values(entries), 1)

  for (const [catId, ms] of Object.entries(entries)) {
    const cat = getCategoryById(catId)
    items.push({
      categoryId: catId,
      name: cat?.name ?? 'Unknown',
      color: cat?.color ?? '#5C5C78',
      ms,
      formatted: formatMs(ms),
      pct: Math.round((ms / max) * 100),
    })
  }

  return items.sort((a, b) => b.ms - a.ms)
})
</script>

<style scoped>
.monthly-page {
  animation: slideUp var(--transition-slow) both;
}

/* ── Month Picker ────────────── */
.month-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-lg);
  margin-bottom: var(--sp-lg);
}

.month-label {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  min-width: 200px;
  text-align: center;
  color: var(--clr-cream);
}

/* ── Total Card ──────────────── */
.month-total {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-sm);
  padding: var(--sp-xl) var(--sp-lg);
  margin-bottom: var(--sp-lg);
  text-align: center;
}

.month-total-label {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.month-total-value {
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--clr-accent);
  letter-spacing: 0.02em;
}

/* ── Breakdown ───────────────── */
.chart-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--sp-md);
  color: var(--clr-cream-dim);
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.breakdown-bar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breakdown-cat {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--clr-cream);
}

.breakdown-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.breakdown-hours {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--clr-accent);
}

.breakdown-bar-bg {
  width: 100%;
  height: 8px;
  background: var(--clr-charcoal);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.breakdown-empty {
  text-align: center;
  color: var(--clr-text-muted);
  font-size: 0.85rem;
  padding: var(--sp-lg) 0;
}

@media (max-width: 640px) {
  .month-label { font-size: 1.1rem; min-width: 160px; }
  .month-total-value { font-size: 2rem; }
}
</style>
