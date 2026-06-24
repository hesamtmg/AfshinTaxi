export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  const isAuthRoute = to.path.startsWith('/auth')
  const isAdminRoute = to.path.startsWith('/admin')
  const isClientRoute = to.path.startsWith('/client')

  if (!authStore.isAuthenticated && !isAuthRoute) {
    if (isAdminRoute) return navigateTo('/auth/admin-login')

  }

  if (authStore.isAuthenticated) {
    if (isAdminRoute && !authStore.isAdmin) return navigateTo('/')
    if (isAuthRoute) {
      return navigateTo(authStore.isAdmin ? '/admin' : '/client/booking')
    }
  }
})
