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
})

// Auto-persist on every change
watch(() => state.categories, (v) => persist('ractime:categories', v), { deep: true })
watch(() => state.tasks, (v) => persist('ractime:tasks', v), { deep: true })
watch(() => state.activeTask, (v) => persist('ractime:activeTask', v), { deep: true })

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
