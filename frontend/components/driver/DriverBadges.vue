<template>
  <v-card v-if="badges.length > 0" rounded="lg" class="mb-4">
    <v-card-title class="pa-4 pb-2 text-body-1 font-weight-bold">
      <v-icon start color="amber">mdi-trophy</v-icon>
      دستاوردها و جوایز
    </v-card-title>
    <v-card-text class="pa-4 pt-0">
      <div class="d-flex flex-wrap gap-3">
        <v-tooltip
          v-for="badge in badges"
          :key="badge.id"
          :text="`${badge.description || badge.title} — ${formatDate(badge.awardedAt)}`"
          location="top"
        >
          <template #activator="{ props }">
            <div
              v-bind="props"
              class="badge-chip d-flex flex-column align-center pa-3 rounded-lg text-center"
              :class="badgeBg(badge.type)"
            >
              <span class="badge-icon">{{ badge.icon }}</span>
              <span class="badge-label text-caption font-weight-medium mt-1">
                {{ badge.title }}
              </span>
            </div>
          </template>
        </v-tooltip>
      </div>
    </v-card-text>
  </v-card>

  <!-- Empty state (only show if prop passed) -->
  <div v-else-if="showEmpty" class="text-center text-medium-emphasis py-4">
    <v-icon size="40" class="mb-2">mdi-trophy-outline</v-icon>
    <p class="text-body-2">هنوز جایزه‌ای دریافت نشده است</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  driverId?: number
  showEmpty?: boolean
}>()

const { $api } = useNuxtApp()
const badges = ref<any[]>([])

const fetchBadges = async () => {
  try {
    const endpoint = props.driverId
      ? `/rewards/admin/driver/${props.driverId}`
      : '/rewards/my-badges'
    const result = await $api(endpoint)
    // If admin view, only show approved ones
    badges.value = props.driverId
      ? result.filter((r: any) => r.status === 'approved')
      : result
  } catch {
    badges.value = []
  }
}

const badgeBg = (type: string) => ({
  trip_milestone: 'badge-blue',
  high_rating: 'badge-amber',
  monthly_top: 'badge-purple',
  custom: 'badge-teal',
}[type] || 'badge-grey')

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fa-IR') : ''

onMounted(fetchBadges)

// re-fetch if driverId changes
watch(() => props.driverId, fetchBadges)
</script>

<style scoped>
.badge-chip {
  width: 80px;
  cursor: default;
  transition: transform 0.15s ease;
}
.badge-chip:hover {
  transform: translateY(-2px);
}
.badge-icon {
  font-size: 2rem;
  line-height: 1;
}
.badge-label {
  font-size: 0.68rem;
  line-height: 1.2;
}

.badge-blue   { background: rgba(25, 118, 210, 0.1); }
.badge-amber  { background: rgba(255, 160, 0, 0.1); }
.badge-purple { background: rgba(123, 31, 162, 0.1); }
.badge-teal   { background: rgba(0, 137, 123, 0.1); }
.badge-grey   { background: rgba(100, 100, 100, 0.1); }
</style>
