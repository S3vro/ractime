<template>
  <div class="container tasks-page">
    <h1 class="page-title">
      <ListTodo :size="28" />
      Task Queue
    </h1>

    <!-- Add Queued Task Form -->
    <form class="add-form glass-card" @submit.prevent="handleAdd" id="add-queued-task-form">
      <div class="form-row">
        <input
          v-model="newName"
          type="text"
          class="input"
          placeholder="Task name…"
          id="queued-task-name-input"
          required
        />
        <input
          v-model="newDesc"
          type="text"
          class="input"
          placeholder="Description (optional)"
          id="queued-task-desc-input"
        />
        <select v-model="newCategory" class="input select" id="queued-task-category-select" required>
          <option value="" disabled>Select category…</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
        <button type="submit" class="btn btn-primary" id="add-queued-task-btn">
          <Plus :size="14" />
          Add
        </button>
      </div>
    </form>

    <!-- Empty state -->
    <div v-if="queuedTasks.length === 0" class="empty-state animate-fade-in">
      <img src="/icon.png" alt="Ractime raccoon" class="empty-hero" />
      <p>No tasks queued — add some above and start them when you're ready!</p>
    </div>

    <!-- Queued task list -->
    <TransitionGroup name="list" tag="div" class="queued-list">
      <div
        v-for="task in queuedTasks"
        :key="task.id"
        class="queued-item glass-card"
        :id="'queued-task-' + task.id"
      >
        <!-- View mode -->
        <template v-if="editingId !== task.id">
          <div class="queued-color" :style="{ background: categoryColor(task.categoryId) }"></div>
          <div class="queued-info">
            <span class="queued-name">{{ task.name }}</span>
            <span v-if="task.description" class="queued-desc">{{ task.description }}</span>
            <span class="queued-category">
              <span class="queued-cat-dot" :style="{ background: categoryColor(task.categoryId) }"></span>
              {{ categoryName(task.categoryId) }}
            </span>
          </div>
          <div class="queued-actions">
            <button
              class="btn btn-primary btn-sm"
              :id="'start-queued-' + task.id"
              @click="handleStart(task)"
              title="Start this task"
            >
              <Play :size="14" />
              Start
            </button>
            <button
              class="btn btn-icon btn-secondary"
              :id="'edit-queued-' + task.id"
              @click="beginEdit(task)"
              title="Edit task"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="btn btn-icon btn-danger"
              :id="'delete-queued-' + task.id"
              @click="handleDelete(task)"
              title="Delete task"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <form class="queued-edit-form" @submit.prevent="saveEdit(task)" :id="'edit-queued-form-' + task.id">
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
            <select v-model="editCategory" class="input input-sm select" required>
              <option value="" disabled>Category…</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <div class="queued-edit-actions">
              <button type="submit" class="btn btn-primary btn-sm">Save</button>
              <button type="button" class="btn btn-secondary btn-sm" @click="cancelEdit">Cancel</button>
            </div>
          </form>
        </template>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ListTodo, Plus, Play, Pencil, Trash2 } from 'lucide-vue-next'
import {
  getCategories,
  getCategoryById,
  getQueuedTasks,
  addQueuedTask,
  updateQueuedTask,
  deleteQueuedTask,
  startQueuedTask,
} from '../stores/storage.js'

const router = useRouter()
const categories = getCategories()
const queuedTasks = getQueuedTasks()

const newName = ref('')
const newDesc = ref('')
const newCategory = ref('')

// Edit state
const editingId = ref(null)
const editName = ref('')
const editDesc = ref('')
const editCategory = ref('')

function categoryColor(id) {
  return getCategoryById(id)?.color ?? '#5C5C78'
}

function categoryName(id) {
  return getCategoryById(id)?.name ?? 'Unknown'
}

function handleAdd() {
  if (!newName.value.trim() || !newCategory.value) return
  addQueuedTask(newName.value.trim(), newDesc.value.trim(), newCategory.value)
  newName.value = ''
  newDesc.value = ''
  newCategory.value = ''
}

function handleStart(task) {
  startQueuedTask(task.id)
  router.push('/')
}

function handleDelete(task) {
  if (confirm(`Remove "${task.name}" from queue?`)) {
    deleteQueuedTask(task.id)
  }
}

function beginEdit(task) {
  editingId.value = task.id
  editName.value = task.name
  editDesc.value = task.description || ''
  editCategory.value = task.categoryId
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editDesc.value = ''
  editCategory.value = ''
}

function saveEdit(task) {
  if (!editName.value.trim()) return
  updateQueuedTask(task.id, {
    name: editName.value.trim(),
    description: editDesc.value.trim(),
    categoryId: editCategory.value,
  })
  cancelEdit()
}
</script>

<style scoped>
.tasks-page {
  animation: slideUp var(--transition-slow) both;
}

.add-form {
  margin-bottom: var(--sp-lg);
}

.form-row {
  display: flex;
  gap: var(--sp-sm);
  align-items: center;
  flex-wrap: wrap;
}

.form-row .input,
.form-row .select {
  flex: 1 1 160px;
}

/* ── Empty state ──────────────── */
.empty-state {
  text-align: center;
  padding: var(--sp-2xl) var(--sp-md);
  color: var(--clr-text-muted);
}

.empty-hero {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  display: block;
  margin: 0 auto var(--sp-md);
  filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.15));
}

/* ── Queued task list ─────────── */
.queued-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.queued-item {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  transition: all var(--transition-fast);
}

.queued-item:hover {
  background: rgba(42, 42, 60, 0.9);
}

.queued-color {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.queued-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.queued-name {
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queued-desc {
  font-size: 0.82rem;
  color: var(--clr-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queued-category {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  font-size: 0.75rem;
  color: var(--clr-text-muted);
}

.queued-cat-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.queued-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ── Edit form ────────────────── */
.queued-edit-form {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  align-items: center;
}

.queued-edit-form .input-sm {
  flex: 1 1 140px;
  padding: 4px 8px;
  font-size: 0.85rem;
}

.queued-edit-actions {
  display: flex;
  gap: 4px;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .form-row { flex-direction: column; }
  .form-row .input { width: 100%; }
  .queued-item { flex-wrap: wrap; }
  .queued-actions { width: 100%; justify-content: flex-end; }
}
</style>
