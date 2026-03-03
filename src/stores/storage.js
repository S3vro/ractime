/**
 * Ractime — Reactive localStorage data store
 *
 * All data is persisted to localStorage and kept
 * reactive via Vue's `reactive` + `watch`.
 */

import { reactive, watch } from 'vue'

// ── Helpers ──────────────────────────────────────────

function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function persist(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── State ────────────────────────────────────────────

const state = reactive({
  categories: load('ractime:categories', []),
  tasks: load('ractime:tasks', []),
  activeTask: load('ractime:activeTask', null),
  queuedTasks: load('ractime:queuedTasks', []),
})

// Auto-persist on every change
watch(() => state.categories, (v) => persist('ractime:categories', v), { deep: true })
watch(() => state.tasks, (v) => persist('ractime:tasks', v), { deep: true })
watch(() => state.activeTask, (v) => persist('ractime:activeTask', v), { deep: true })
watch(() => state.queuedTasks, (v) => persist('ractime:queuedTasks', v), { deep: true })

// ── Categories ───────────────────────────────────────

export function getCategories() {
  return state.categories
}

export function getCategoryById(id) {
  return state.categories.find((c) => c.id === id) ?? null
}

export function addCategory(name, color) {
  const cat = { id: uuid(), name, color, createdAt: Date.now() }
  state.categories.push(cat)
  return cat
}

export function updateCategory(id, updates) {
  const cat = getCategoryById(id)
  if (cat) Object.assign(cat, updates)
}

export function deleteCategory(id) {
  const idx = state.categories.findIndex((c) => c.id === id)
  if (idx !== -1) state.categories.splice(idx, 1)
  // Also remove tasks that belong to this category
  state.tasks = state.tasks.filter((t) => t.categoryId !== id)
  state.queuedTasks = state.queuedTasks.filter((t) => t.categoryId !== id)
}

// ── Tasks ────────────────────────────────────────────

export function getTasks() {
  return state.tasks
}

export function getTaskById(id) {
  return state.tasks.find((t) => t.id === id) ?? null
}

export function startTask(name, description, categoryId) {
  // Stop any currently running task first
  if (state.activeTask) stopTask()

  const task = {
    id: uuid(),
    name,
    description,
    categoryId,
    entries: [{ start: Date.now(), end: null }],
  }
  state.tasks.push(task)
  state.activeTask = { taskId: task.id, startedAt: task.entries[0].start }
  return task
}

export function stopTask() {
  if (!state.activeTask) return null
  const task = getTaskById(state.activeTask.taskId)
  if (task) {
    const openEntry = task.entries.find((e) => e.end === null)
    if (openEntry) openEntry.end = Date.now()
  }
  state.activeTask = null
  return task
}

export function updateTask(id, updates) {
  const task = getTaskById(id)
  if (task) Object.assign(task, updates)
}

export function deleteTask(id) {
  // If this task is currently active, stop it first
  if (state.activeTask?.taskId === id) {
    state.activeTask = null
  }
  const idx = state.tasks.findIndex((t) => t.id === id)
  if (idx !== -1) state.tasks.splice(idx, 1)
}

export function getTasksByCategory(categoryId) {
  return state.tasks.filter((t) => t.categoryId === categoryId)
}

export function getActiveTask() {
  if (!state.activeTask) return null
  return getTaskById(state.activeTask.taskId)
}

export function getActiveTaskMeta() {
  return state.activeTask
}

// ── Queued Tasks (Task Queue) ────────────────────────

export function getQueuedTasks() {
  return state.queuedTasks
}

export function getQueuedTaskById(id) {
  return state.queuedTasks.find((t) => t.id === id) ?? null
}

export function addQueuedTask(name, description, categoryId) {
  const task = { id: uuid(), name, description, categoryId, createdAt: Date.now() }
  state.queuedTasks.push(task)
  return task
}

export function updateQueuedTask(id, updates) {
  const task = getQueuedTaskById(id)
  if (task) Object.assign(task, updates)
}

export function deleteQueuedTask(id) {
  const idx = state.queuedTasks.findIndex((t) => t.id === id)
  if (idx !== -1) state.queuedTasks.splice(idx, 1)
}

/**
 * Moves a queued task into the active timer system.
 * Returns the newly created running task.
 */
export function startQueuedTask(id) {
  const queued = getQueuedTaskById(id)
  if (!queued) return null
  const runningTask = startTask(queued.name, queued.description, queued.categoryId)
  deleteQueuedTask(id)
  return runningTask
}

// ── Time Queries ─────────────────────────────────────

function dayStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayEnd(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function weekRange(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday.getTime(), end: sunday.getTime() }
}

/**
 * Returns flat list of { taskId, taskName, categoryId, start, end }
 * for a given day.
 */
export function getEntriesForDay(date = new Date()) {
  const dStart = dayStart(date)
  const dEnd = dayEnd(date)
  const result = []

  for (const task of state.tasks) {
    for (const entry of task.entries) {
      const entryEnd = entry.end ?? Date.now()
      if (entryEnd >= dStart && entry.start <= dEnd) {
        result.push({
          taskId: task.id,
          taskName: task.name,
          categoryId: task.categoryId,
          start: Math.max(entry.start, dStart),
          end: Math.min(entryEnd, dEnd),
        })
      }
    }
  }
  return result.sort((a, b) => a.start - b.start)
}

/**
 * Returns { categoryId → totalMs } for the ISO week containing `date`.
 */
export function getEntriesForWeek(date = new Date()) {
  const { start: wStart, end: wEnd } = weekRange(date)
  const totals = {}

  for (const task of state.tasks) {
    for (const entry of task.entries) {
      const entryEnd = entry.end ?? Date.now()
      if (entryEnd >= wStart && entry.start <= wEnd) {
        const clampedStart = Math.max(entry.start, wStart)
        const clampedEnd = Math.min(entryEnd, wEnd)
        const duration = clampedEnd - clampedStart
        totals[task.categoryId] = (totals[task.categoryId] ?? 0) + duration
      }
    }
  }
  return totals
}

/**
 * Total tracked milliseconds for the ISO week containing `date`.
 */
export function getWeekTotalMs(date = new Date()) {
  const totals = getEntriesForWeek(date)
  let sum = 0
  for (const ms of Object.values(totals)) sum += ms
  return sum
}

/**
 * Average tracked ms per elapsed day in the ISO week containing `date`.
 * On a Wednesday it divides by 3, not 7.
 */
export function getWeekAvgMsPerDay(date = new Date()) {
  const { start: wStart } = weekRange(date)
  const now = Date.now()
  const elapsed = Math.min(now, date.getTime()) // don't go past "today"
  const dayMs = 86400000
  const daysPassed = Math.max(1, Math.floor((elapsed - wStart) / dayMs) + 1)
  const total = getWeekTotalMs(date)
  return Math.round(total / daysPassed)
}

function monthRange(year, month) {
  const start = new Date(year, month, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(year, month + 1, 0) // last day of month
  end.setHours(23, 59, 59, 999)
  return { start: start.getTime(), end: end.getTime() }
}

/**
 * Returns { categoryId → totalMs } for the given month (0-indexed).
 */
export function getEntriesForMonth(year, month) {
  const { start: mStart, end: mEnd } = monthRange(year, month)
  const totals = {}

  for (const task of state.tasks) {
    for (const entry of task.entries) {
      const entryEnd = entry.end ?? Date.now()
      if (entryEnd >= mStart && entry.start <= mEnd) {
        const clampedStart = Math.max(entry.start, mStart)
        const clampedEnd = Math.min(entryEnd, mEnd)
        const duration = clampedEnd - clampedStart
        totals[task.categoryId] = (totals[task.categoryId] ?? 0) + duration
      }
    }
  }
  return totals
}

// ── CSV Export ────────────────────────────────────────

function escCsv(val) {
  const str = String(val ?? '')
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

function msToDuration(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${m}m ${s}s`
}

/**
 * Exports all tasks as a CSV file and triggers a browser download.
 * One row per time entry.
 */
export function exportCsv() {
  const headers = ['Task', 'Description', 'Category', 'Start', 'End', 'Duration']
  const rows = [headers.map(escCsv).join(',')]

  for (const task of state.tasks) {
    const cat = getCategoryById(task.categoryId)
    for (const entry of task.entries) {
      const end = entry.end ?? Date.now()
      const duration = end - entry.start
      rows.push([
        escCsv(task.name),
        escCsv(task.description),
        escCsv(cat?.name ?? 'Unknown'),
        escCsv(formatDate(entry.start)),
        escCsv(formatDate(entry.end)),
        escCsv(msToDuration(duration)),
      ].join(','))
    }
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ractime-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
