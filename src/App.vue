<template>
  <div class="app">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="logo" id="nav-logo">
          <img src="/icon.png" alt="Ractime" class="logo-icon" />
          <span class="logo-text">Ractime</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link" id="nav-dashboard" exact-active-class="nav-link--active">
            <BarChart3 :size="16" />
            Dashboard
          </router-link>
          <router-link to="/tasks" class="nav-link" id="nav-tasks" active-class="nav-link--active">
            <ListTodo :size="16" />
            Tasks
          </router-link>
          <router-link to="/categories" class="nav-link" id="nav-categories" active-class="nav-link--active">
            <Tags :size="16" />
            Categories
          </router-link>
          <router-link to="/monthly" class="nav-link" id="nav-monthly" active-class="nav-link--active">
            <CalendarDays :size="16" />
            Monthly
          </router-link>
          <button class="nav-link" id="export-csv-btn" @click="handleExport" title="Export data as CSV">
            <Download :size="16" />
            Export
          </button>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

  </div>
</template>

<script setup>
import { BarChart3, ListTodo, Tags, Download, CalendarDays } from 'lucide-vue-next'
import { exportCsv } from './stores/storage.js'

function handleExport() {
  exportCsv()
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Navbar ─────────────────────────── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(30, 30, 46, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--clr-border);
}

.navbar-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--sp-sm) var(--sp-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--sp-sm);
  text-decoration: none;
  color: var(--clr-cream);
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.logo-text {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.35rem;
  background: linear-gradient(135deg, var(--clr-brown-light), var(--clr-cream));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: var(--sp-xs);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-xs) var(--sp-md);
  border-radius: var(--radius-sm);
  color: var(--clr-text-muted);
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all var(--transition-fast);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
}

.nav-link:hover {
  color: var(--clr-cream);
  background: var(--clr-surface-hover);
}

.nav-link--active {
  color: var(--clr-cream) !important;
  background: var(--clr-surface);
}

/* ── Main ───────────────────────────── */
.main-content {
  flex: 1;
}


@media (max-width: 640px) {
  .logo-text { font-size: 1.1rem; }
  .nav-link { font-size: 0.8rem; padding: var(--sp-xs) var(--sp-sm); }
}
</style>
