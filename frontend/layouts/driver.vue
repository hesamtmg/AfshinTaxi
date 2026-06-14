<template>
  <v-app>
    <!-- نوار بالایی -->
    <v-app-bar color="secondary" elevation="0" height="64">
      <v-container class="d-flex align-center pa-0">
        <div class="d-flex align-center gap-2">
          <v-icon color="primary" size="28">mdi-taxi</v-icon>
          <span class="text-h6 font-weight-bold text-white">افشین‌تاکسی</span>
          <v-chip size="x-small" color="primary" class="mr-1">راننده</v-chip>
        </div>

        <v-spacer />

        <div class="d-flex align-center gap-3">
          <!-- لینک‌های ناوبری -->
          <v-btn
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            variant="text"
            color="white"
            size="small"
            :prepend-icon="item.icon"
            class="opacity-80"
            active-class="opacity-100"
          >
            {{ item.label }}
          </v-btn>

          <!-- منوی آواتار راننده -->
          <v-menu>
            <template #activator="{ props }">
              <v-avatar
                v-bind="props"
                color="primary"
                size="38"
                class="cursor-pointer mr-2"
              >
                <span class="text-body-2 font-weight-bold text-white">
                  {{ driverStore.driver?.fullName?.charAt(0) }}
                </span>
              </v-avatar>
            </template>
            <v-list rounded="lg" min-width="200">
              <v-list-item
                :title="driverStore.driver?.fullName"
                :subtitle="driverStore.driver?.phone"
                prepend-icon="mdi-account-tie"
              />
              <v-divider />
              <v-list-item
                title="پروفایل من"
                prepend-icon="mdi-account"
                to="/driver/profile"
              />
              <v-list-item
                title="خروج"
                prepend-icon="mdi-logout"
                color="error"
                @click="logout"
              />
            </v-list>
          </v-menu>
        </div>
      </v-container>
    </v-app-bar>

    <v-main style="background:#F8F9FA">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const driverStore = useDriverStore()

const navItems = [
  { label: 'داشبورد', icon: 'mdi-view-dashboard', to: '/driver' },
  { label: 'سفرهای من', icon: 'mdi-car-multiple', to: '/driver/trips' },
]

const logout = () => {
  driverStore.logout()
  navigateTo('/driver/login')
}
</script>