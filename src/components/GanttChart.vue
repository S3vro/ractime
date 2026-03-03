<template>
  <div class="gantt" id="gantt-chart">
    <!-- Hour labels -->
    <div class="gantt-hours">
      <span v-for="h in hourLabels" :key="h" class="gantt-hour-label">{{ h }}</span>
    </div>

    <!-- Timeline track -->
    <div class="gantt-track" ref="trackEl">
      <!-- Hour gridlines -->
      <div
        v-for="h in 24"
        :key="'grid-' + h"
        class="gantt-gridline"
        :style="{ left: ((h) / 24) * 100 + '%' }"
      ></div>

      <!-- Current time indicator -->
      <div
        class="gantt-now"
        :style="{ left: nowPercent + '%' }"
        title="Now"
      ></div>

      <!-- Task bars -->
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="gantt-bar"
        :style="barStyle(entry)"
        :title="`${entry.taskName}: ${formatTime(entry.start)} – ${formatTime(entry.end)}`"
      >
        <span class="gantt-bar-label" v-if="barWidth(entry) > 6">{{ entry.taskName }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <p v-if="entries.length === 0" class="gantt-empty">No entries today — start a task!</p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getEntriesForDay, getCategoryById } from '../stores/storage.js'

const now = ref(Date.now())
let tickInterval = null

onMounted(() => { tickInterval = setInterval(() => { now.value = Date.now() }, 30000) })
onUnmounted(() => clearInterval(tickInterval))

const entries = computed(() => {
  // touch `now` so the computed refreshes
  void now.value
  return getEntriesForDay(new Date())
})

const hourLabels = ['0', '3', '6', '9', '12', '15', '18', '21', '24']

const nowPercent = computed(() => {
  const d = new Date()
  return ((d.getHours() * 60 + d.getMinutes()) / 1440) * 100
})

function msOfDay(ts) {
  const d = new Date(ts)
  return d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000
}

function barStyle(entry) {
  const cat = getCategoryById(entry.categoryId)
  const left = (msOfDay(entry.start) / 86400000) * 100
  const width = ((entry.end - entry.start) / 86400000) * 100
  return {
    left: left + '%',
    width: Math.max(width, 0.3) + '%',
    background: cat?.color ?? '#4CAF50',
  }
}

function barWidth(entry) {
  return ((entry.end - entry.start) / 86400000) * 100
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.gantt {
  user-select: none;
}

.gantt-hours {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--clr-text-muted);
  margin-bottom: var(--sp-xs);
  padding: 0 2px;
}

.gantt-track {
  position: relative;
  height: 56px;
  background: var(--clr-charcoal);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.gantt-gridline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--clr-border);
}

.gantt-now {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--clr-accent);
  box-shadow: 0 0 6px var(--clr-accent);
  z-index: 5;
}

.gantt-bar {
  position: absolute;
  top: 8px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  opacity: 0.9;
  transition: opacity var(--transition-fast);
  z-index: 2;
  cursor: default;
}

.gantt-bar:hover {
  opacity: 1;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
}

.gantt-bar-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}

.gantt-empty {
  text-align: center;
  color: var(--clr-text-muted);
  font-size: 0.85rem;
  margin-top: var(--sp-md);
}
</style>
