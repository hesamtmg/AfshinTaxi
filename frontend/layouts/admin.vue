<template>
  <v-app style="direction: rtl !important;">
    <v-navigation-drawer v-model="drawer" color="secondary" width="260" permanent>
      <!-- لوگو -->
      <div class="pa-6 d-flex align-center">
        <v-icon color="primary" size="32" class="mr-3">mdi-taxi</v-icon>
        <div>
          <div class="text-white font-weight-bold text-h6">افشین‌تاکسی</div>
          <div class="text-grey text-caption">پنل مدیریت</div>
        </div>
      </div>

      <v-divider color="white" opacity="0.1" />

      <v-list nav class="pa-3 mt-2">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          color="primary"
          active-color="primary"
          class="mb-1"
        />
      </v-list>

      <template #append>
        <v-divider color="white" opacity="0.1" />
        <div class="pa-4">
          <v-list-item
            :title="authStore.user?.fullName"
            subtitle="مدیر سیستم"
            prepend-icon="mdi-account-circle"
            class="text-white mb-2"
          />
          <v-btn
            block
            variant="tonal"
            color="error"
            prepend-icon="mdi-logout"
            @click="logout"
          >
            خروج
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="white" elevation="0" border="b">
      <v-app-bar-title>
        <span class="text-secondary font-weight-medium">{{ pageTitle }}</span>
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()
const drawer = ref(true)

const navItems = [
  { title: 'داشبورد', icon: 'mdi-view-dashboard', to: '/admin' },
  { title: 'رزروها', icon: 'mdi-calendar-clock', to: '/admin/bookings' },
  { title: 'رانندگان', icon: 'mdi-car-multiple', to: '/admin/drivers' },
  { title: 'مشتریان', icon: 'mdi-account-group', to: '/admin/customers' },
  { title: 'تنظیمات', icon: 'mdi-cog', to: '/admin/settings' },
  { title: 'گزارشات', icon: 'mdi-chart-bar', to: '/admin/reports' },
]

const pageTitle = computed(() => {
  const match = navItems.find((item) => route.path.startsWith(item.to))
  return match?.title || 'مدیریت'
})

const logout = () => {
  authStore.logout()
  navigateTo('/auth/admin-login')
}
</script>