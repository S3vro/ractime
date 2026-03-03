import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import CategoriesView from '../views/CategoriesView.vue'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' },
    },
    {
        path: '/categories',
        name: 'Categories',
        component: CategoriesView,
        meta: { title: 'Categories' },
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

router.afterEach((to) => {
    document.title = `${to.meta.title ?? 'Ractime'} — Ractime`
})

export default router
