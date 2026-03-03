<template>
  <div class="container categories-page">
    <h1 class="page-title">🏷️ Categories</h1>

    <!-- Add Category Form -->
    <form class="add-form glass-card" @submit.prevent="handleAdd" id="add-category-form">
      <div class="form-row">
        <input
          v-model="newName"
          type="text"
          class="input"
          placeholder="Category name…"
          id="category-name-input"
          required
        />
        <input
          v-model="newColor"
          type="color"
          class="color-input"
          id="category-color-input"
          title="Pick a color"
        />
        <button type="submit" class="btn btn-primary" id="add-category-btn">
          + Add
        </button>
      </div>
    </form>

    <!-- Empty state -->
    <div v-if="categories.length === 0" class="empty-state animate-fade-in">
      <span class="empty-emoji">🦝</span>
      <p>No categories yet — create one above!</p>
    </div>

    <!-- Category list -->
    <TransitionGroup name="list" tag="div" class="categories-grid">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="category-wrapper"
        :id="'category-' + cat.id"
      >
        <!-- Category header (clickable) -->
        <div
          class="category-card glass-card"
          :class="{ 'category-card--expanded': expandedId === cat.id }"
          @click="toggleExpand(cat.id)"
        >
          <div class="category-color" :style="{ background: cat.color }"></div>
          <div class="category-info">
            <span class="category-name">{{ cat.name }}</span>
            <span class="category-meta">
              {{ taskCount(cat.id) }} task{{ taskCount(cat.id) !== 1 ? 's' : '' }}
            </span>
          </div>
          <span class="category-chevron" :class="{ 'category-chevron--open': expandedId === cat.id }">▸</span>
          <button
            class="btn btn-icon btn-danger"
            :id="'delete-category-' + cat.id"
            @click.stop="handleDeleteCategory(cat)"
            title="Delete category"
          >
            ✕
          </button>
        </div>

        <!-- Expanded task list -->
        <transition name="slide">
          <div v-if="expandedId === cat.id" class="task-list">
            <div v-if="categoryTasks(cat.id).length === 0" class="task-empty">
              No tasks in this category yet.
            </div>

            <div
              v-for="task in categoryTasks(cat.id)"
              :key="task.id"
              class="task-item"
              :id="'task-' + task.id"
            >
              <!-- View mode -->
              <template v-if="editingTaskId !== task.id">
                <div class="task-item-info">
                  <span class="task-item-name">{{ task.name }}</span>
                  <span v-if="task.description" class="task-item-desc">{{ task.description }}</span>
                  <span class="task-item-time">{{ formatDuration(task) }}</span>
                </div>
                <div class="task-item-actions">
                  <button
                    class="btn btn-icon btn-secondary"
                    :id="'edit-task-' + task.id"
                    @click="startEditing(task)"
                    title="Edit task"
                  >
                    ✎
                  </button>
                  <button
                    class="btn btn-icon btn-danger"
                    :id="'delete-task-' + task.id"
                    @click="handleDeleteTask(task)"
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </template>

              <!-- Edit mode -->
              <template v-else>
                <form class="task-edit-form" @submit.prevent="saveEditing(task)" :id="'edit-form-' + task.id">
                  <input
                    v-model="editName"
                    type="text"
                    class="input input-sm"
                    placeholder="Task name"
                    required
                  />
                  <input
                    v-model="editDesc"
                    type="text"
                    class="input input-sm"
                    placeholder="Description"
                  />
                  <div class="entry-edit-list">
                    <div
                      v-for="(entry, idx) in editEntries"
                      :key="idx"
                      class="entry-edit-row"
                    >
                      <label class="entry-label">Entry {{ idx + 1 }}</label>
                      <div class="entry-fields">
                        <div class="entry-field">
                          <span class="entry-field-label">Start</span>
                          <input
                            v-model="entry.start"
                            type="datetime-local"
                            step="1"
                            class="input input-sm"
                            required
                          />
                        </div>
                        <div class="entry-field">
                          <span class="entry-field-label">End</span>
                          <input
                            v-model="entry.end"
                            type="datetime-local"
                            step="1"
                            class="input input-sm"
                            :required="entry.end !== ''"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="task-edit-actions">
                    <button type="submit" class="btn btn-primary btn-sm">Save</button>
                    <button type="button" class="btn btn-secondary btn-sm" @click="cancelEditing">Cancel</button>
                  </div>
                </form>
              </template>
            </div>
          </div>
        </transition>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  getCategories,
  addCategory,
  deleteCategory,
  getTasks,
  getTasksByCategory,
  updateTask,
  deleteTask,
} from '../stores/storage.js'

const categories = getCategories()
const tasks = getTasks()

const newName = ref('')
const newColor = ref('#8B5E3C')
const expandedId = ref(null)

// Edit state
const editingTaskId = ref(null)
const editName = ref('')
const editDesc = ref('')
const editEntries = ref([])

// ── Datetime helpers ─────────────────

function tsToLocal(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function localToTs(str) {
  if (!str) return null
  return new Date(str).getTime()
}

// ── Category actions ──────────────────

function handleAdd() {
  if (!newName.value.trim()) return
  addCategory(newName.value.trim(), newColor.value)
  newName.value = ''
  newColor.value = '#8B5E3C'
}

function handleDeleteCategory(cat) {
  if (confirm(`Delete "${cat.name}" and all its tasks?`)) {
    if (expandedId.value === cat.id) expandedId.value = null
    deleteCategory(cat.id)
  }
}

function toggleExpand(catId) {
  expandedId.value = expandedId.value === catId ? null : catId
  cancelEditing()
}

function taskCount(categoryId) {
  return tasks.filter((t) => t.categoryId === categoryId).length
}

function categoryTasks(categoryId) {
  return getTasksByCategory(categoryId)
}

// ── Task actions ──────────────────────

function startEditing(task) {
  editingTaskId.value = task.id
  editName.value = task.name
  editDesc.value = task.description || ''
  editEntries.value = task.entries.map((e) => ({
    start: tsToLocal(e.start),
    end: tsToLocal(e.end),
  }))
}

function cancelEditing() {
  editingTaskId.value = null
  editName.value = ''
  editDesc.value = ''
  editEntries.value = []
}

function saveEditing(task) {
  if (!editName.value.trim()) return
  const entries = editEntries.value.map((e) => ({
    start: localToTs(e.start) ?? task.entries[0]?.start ?? Date.now(),
    end: e.end ? localToTs(e.end) : null,
  }))
  updateTask(task.id, {
    name: editName.value.trim(),
    description: editDesc.value.trim(),
    entries,
  })
  cancelEditing()
}

function handleDeleteTask(task) {
  if (confirm(`Delete task "${task.name}"?`)) {
    deleteTask(task.id)
  }
}

// ── Formatting ────────────────────────

function formatDuration(task) {
  let totalMs = 0
  for (const entry of task.entries) {
    const end = entry.end ?? Date.now()
    totalMs += end - entry.start
  }
  const mins = Math.floor(totalMs / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hours}h ${remMins}m`
}
</script>

<style scoped>
.categories-page {
  animation: slideUp var(--transition-slow) both;
}

.add-form {
  margin-bottom: var(--sp-lg);
}

.form-row {
  display: flex;
  gap: var(--sp-sm);
  align-items: center;
}

.form-row .input {
  flex: 1;
}

/* ── Empty state ──────────────── */
.empty-state {
  text-align: center;
  padding: var(--sp-2xl) var(--sp-md);
  color: var(--clr-text-muted);
}

.empty-emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--sp-md);
}

/* ── Category grid ────────────── */
.categories-grid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.category-card {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-card:hover {
  background: rgba(42, 42, 60, 0.9);
}

.category-card--expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
}

.category-color {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(0,0,0,0.3);
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-name {
  font-weight: 600;
  font-size: 1rem;
}

.category-meta {
  font-size: 0.78rem;
  color: var(--clr-text-muted);
}

.category-chevron {
  font-size: 0.9rem;
  color: var(--clr-text-muted);
  transition: transform var(--transition-fast);
  display: inline-block;
}

.category-chevron--open {
  transform: rotate(90deg);
}

/* ── Task list ────────────────── */
.task-list {
  background: rgba(30, 30, 46, 0.5);
  border: 1px solid var(--clr-border);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  padding: var(--sp-sm);
}

.task-empty {
  text-align: center;
  color: var(--clr-text-muted);
  font-size: 0.82rem;
  padding: var(--sp-md);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  padding: var(--sp-sm) var(--sp-md);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.task-item:hover {
  background: rgba(42, 42, 60, 0.5);
}

.task-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-item-name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item-desc {
  font-size: 0.78rem;
  color: var(--clr-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item-time {
  font-size: 0.72rem;
  color: var(--clr-accent);
  font-weight: 500;
}

.task-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ── Edit form ────────────────── */
.task-edit-form {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  align-items: center;
}

.task-edit-form .input-sm {
  flex: 1 1 140px;
  padding: 4px 8px;
  font-size: 0.85rem;
}

.task-edit-actions {
  display: flex;
  gap: 4px;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.8rem;
}

/* ── Entry time editing ───────── */
.entry-edit-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  margin-top: var(--sp-xs);
}

.entry-edit-row {
  background: rgba(30, 30, 46, 0.4);
  border-radius: var(--radius-sm);
  padding: var(--sp-sm);
}

.entry-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  display: block;
}

.entry-fields {
  display: flex;
  gap: var(--sp-sm);
  flex-wrap: wrap;
}

.entry-field {
  flex: 1 1 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-field-label {
  font-size: 0.7rem;
  color: var(--clr-text-muted);
}

@media (max-width: 640px) {
  .form-row { flex-wrap: wrap; }
  .form-row .input { width: 100%; }
  .task-item { flex-wrap: wrap; }
}
</style>
