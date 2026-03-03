<template>
  <div class="pie-wrapper" id="pie-chart">
    <div v-if="hasData" class="pie-canvas-wrapper">
      <Pie :data="chartData" :options="chartOptions" />
    </div>
    <p v-else class="pie-empty">No data this week — track some time!</p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { getEntriesForWeek, getCategoryById, getCategories } from '../stores/storage.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const now = ref(Date.now())
let tickInterval = null
onMounted(() => { tickInterval = setInterval(() => { now.value = Date.now() }, 60000) })
onUnmounted(() => clearInterval(tickInterval))

const weekData = computed(() => {
  void now.value
  return getEntriesForWeek(new Date())
})

const hasData = computed(() => Object.keys(weekData.value).length > 0)

function msToHours(ms) {
  return +(ms / 3600000).toFixed(2)
}

const chartData = computed(() => {
  const entries = weekData.value
  const labels = []
  const data = []
  const bgColors = []

  for (const [catId, ms] of Object.entries(entries)) {
    const cat = getCategoryById(catId)
    labels.push(cat?.name ?? 'Unknown')
    data.push(msToHours(ms))
    bgColors.push(cat?.color ?? '#5C5C78')
  }

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: bgColors,
      borderColor: 'rgba(30, 30, 46, 0.8)',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#F5E6D3',
        font: { family: 'Inter', size: 12 },
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 12,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(42, 42, 60, 0.95)',
      titleColor: '#F5E6D3',
      bodyColor: '#D9C9B5',
      borderColor: 'rgba(245, 230, 211, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label(ctx) {
          const hrs = ctx.parsed
          return ` ${hrs}h`
        },
      },
    },
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 800,
    easing: 'easeOutQuart',
  },
}
</script>

<style scoped>
.pie-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.pie-canvas-wrapper {
  width: 100%;
  max-width: 320px;
}

.pie-empty {
  text-align: center;
  color: var(--clr-text-muted);
  font-size: 0.85rem;
}
</style>
