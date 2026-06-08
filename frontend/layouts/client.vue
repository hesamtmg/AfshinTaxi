<template>
  <v-app>
    <!-- Top Navigation -->
    <v-app-bar color="white" elevation="1" height="64">
      <v-container class="d-flex align-center pa-0">
        <NuxtLink to="/" class="text-decoration-none d-flex align-center">
          <v-icon color="primary" size="28" class="mr-2">mdi-taxi</v-icon>
          <span class="text-h6 font-weight-bold text-secondary">AfshinTaxi</span>
        </NuxtLink>

        <v-spacer />

        <div v-if="authStore.isAuthenticated" class="d-flex align-center gap-2">
          <v-btn variant="text" to="/client/trips" prepend-icon="mdi-history">
            My Trips
          </v-btn>
          <v-btn color="primary" variant="tonal" to="/client/booking">
            Book a Ride
          </v-btn>
          <v-menu>
            <template #activator="{ props }">
              <v-avatar
                v-bind="props"
                color="primary"
                size="36"
                class="cursor-pointer ml-2"
              >
                <span class="text-body-2 font-weight-bold text-white">
                  {{ authStore.user?.fullName?.charAt(0) }}
                </span>
              </v-avatar>
            </template>
            <v-list rounded="lg" min-width="180">
              <v-list-item
                :title="authStore.user?.fullName"
                :subtitle="authStore.user?.phone"
                prepend-icon="mdi-account-circle"
              />
              <v-divider />
              <v-list-item
                title="Profile"
                prepend-icon="mdi-account-edit"
                to="/client/profile"
              />
              <v-list-item
                title="Logout"
                prepend-icon="mdi-logout"
                color="error"
                @click="logout"
              />
            </v-list>
          </v-menu>
        </div>

        <div v-else class="d-flex gap-2">
          <v-btn variant="text" to="/auth/login">Login</v-btn>
          <v-btn color="primary" to="/auth/register">Register</v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <!-- Footer -->
    <v-footer color="secondary" class="pa-6">
      <v-container>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-taxi</v-icon>
            <span class="text-white font-weight-bold">AfshinTaxi</span>
          </div>
          <span class="text-grey-lighten-1 text-body-2">
            © {{ new Date().getFullYear() }} AfshinTaxi. All rights reserved.
          </span>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
  navigateTo('/auth/login')
}
</script>
