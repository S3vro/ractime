<template>
  <div class="app">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="logo" id="nav-logo">
          <span class="logo-icon">🦝</span>
          <span class="logo-text">Ractime</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link" id="nav-dashboard" exact-active-class="nav-link--active">
            <span class="nav-link-icon">📊</span>
            Dashboard
          </router-link>
          <router-link to="/categories" class="nav-link" id="nav-categories" active-class="nav-link--active">
            <span class="nav-link-icon">🏷️</span>
            Categories
          </router-link>
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
// App shell — no logic needed here
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
  font-size: 1.6rem;
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
}

.nav-link:hover {
  color: var(--clr-cream);
  background: var(--clr-surface-hover);
}

.nav-link--active {
  color: var(--clr-cream) !important;
  background: var(--clr-surface);
}

.nav-link-icon {
  font-size: 1rem;
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
