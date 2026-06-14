<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold text-secondary">مشتریان</div>
        <div class="text-body-2 text-grey">مدیریت کاربران ثبت نام شده</div>
      </div>
    </div>

    <!-- آمار -->
    <v-row class="mb-6">
      <v-col v-for="stat in stats" :key="stat.label" cols="6" md="3">
        <v-card rounded="xl" class="pa-4">
          <div class="d-flex align-center gap-3">
            <v-avatar :color="stat.color" size="44" rounded="lg">
              <v-icon color="white" size="22">{{ stat.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold text-secondary">{{ stat.value }}</div>
              <div class="text-caption text-grey">{{ stat.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- جدول -->
    <v-card rounded="xl" class="pa-0">
      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        :search="search"
        hover
        @click:row="(_, { item }) => openDetail(item)"
      >
        <template #top>
          <div class="pa-4 d-flex align-center gap-3">
            <v-text-field
              v-model="search"
              placeholder="جستجو بر اساس نام، تلفن، ایمیل..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              rounded="lg"
              hide-details
              density="compact"
              style="max-width:320px"
            />
            <v-btn-toggle v-model="statusFilter" color="primary" density="compact" rounded="lg" variant="outlined">
              <v-btn value="all" size="small">همه</v-btn>
              <v-btn value="active" size="small">فعال</v-btn>
              <v-btn value="suspended" size="small">معلق</v-btn>
            </v-btn-toggle>
            <v-spacer />
            <v-btn variant="tonal" color="primary" prepend-icon="mdi-refresh" @click="fetchUsers">بروزرسانی</v-btn>
          </div>
        </template>

        <template #item.fullName="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-avatar color="primary" size="38">
              <span class="text-body-2 font-weight-bold text-white">{{ item.fullName?.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.fullName }}</div>
              <div class="text-caption text-grey">{{ item.email || '—' }}</div>
            </div>
          </div>
        </template>

        <template #item.phone="{ item }">
          <span class="text-body-2 font-family-mono">{{ item.phone }}</span>
        </template>

        <template #item.isVerified="{ item }">
          <v-chip :color="item.isVerified ? 'success' : 'warning'" size="small" label>
            <v-icon start size="12">{{ item.isVerified ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
            {{ item.isVerified ? 'تأیید شده' : 'در انتظار' }}
          </v-chip>
        </template>

        <template #item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'success' : 'error'" size="small" variant="tonal" label>
            {{ item.isActive ? 'فعال' : 'معلق' }}
          </v-chip>
        </template>

        <template #item.createdAt="{ item }">
          <div class="text-body-2">{{ new Date(item.createdAt).toLocaleDateString('fa-IR') }}</div>
          <div class="text-caption text-grey">{{ new Date(item.createdAt).toLocaleTimeString('fa-IR') }}</div>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" @click.stop="openDetail(item)" />
          <v-btn
            :icon="item.isActive ? 'mdi-account-cancel' : 'mdi-account-check'"
            size="small"
            variant="text"
            :color="item.isActive ? 'error' : 'success'"
            @click.stop="toggleActive(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- پنجره کناری جزئیات مشتری -->
    <v-navigation-drawer v-model="detailDrawer" location="right" width="440" temporary>
      <div v-if="selectedUser" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <div class="text-h6 font-weight-bold text-secondary">پروفایل مشتری</div>
          <v-btn icon="mdi-close" variant="text" @click="detailDrawer = false" />
        </div>

        <!-- آواتار + نام -->
        <div class="text-center mb-6">
          <v-avatar color="primary" size="72" class="mb-3">
            <span class="text-h4 font-weight-bold text-white">{{ selectedUser.fullName?.charAt(0) }}</span>
          </v-avatar>
          <div class="text-h6 font-weight-bold text-secondary">{{ selectedUser.fullName }}</div>
          <div class="text-body-2 text-grey">{{ selectedUser.phone }}</div>
          <div class="d-flex justify-center gap-2 mt-3">
            <v-chip :color="selectedUser.isVerified ? 'success' : 'warning'" size="small" label>
              {{ selectedUser.isVerified ? 'تأیید شده' : 'تأیید نشده' }}
            </v-chip>
            <v-chip :color="selectedUser.isActive ? 'success' : 'error'" size="small" variant="tonal" label>
              {{ selectedUser.isActive ? 'فعال' : 'معلق' }}
            </v-chip>
          </div>
        </div>

        <v-divider class="mb-4" />

        <!-- اطلاعات -->
        <div class="text-caption text-grey font-weight-bold mb-2">اطلاعات حساب</div>
        <v-list lines="two" density="compact" class="mb-4">
          <v-list-item prepend-icon="mdi-phone">
            <template #title><span class="text-caption text-grey">تلفن</span></template>
            <template #subtitle>{{ selectedUser.phone }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-email">
            <template #title><span class="text-caption text-grey">ایمیل</span></template>
            <template #subtitle>{{ selectedUser.email || '—' }}</template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-calendar">
            <template #title><span class="text-caption text-grey">تاریخ ثبت نام</span></template>
            <template #subtitle>{{ new Date(selectedUser.createdAt).toLocaleString('fa-IR') }}</template>
          </v-list-item>
        </v-list>

        <v-divider class="mb-4" />

        <!-- تاریخچه رزرو این کاربر -->
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-caption text-grey font-weight-bold">تاریخچه رزروها</div>
          <v-chip size="x-small" color="primary" variant="tonal">{{ userBookings.length }} سفر</v-chip>
        </div>

        <div v-if="loadingBookings" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>

        <div v-else-if="userBookings.length === 0" class="text-center pa-6 text-grey text-body-2">
          هنوز رزروی ثبت نشده است
        </div>

        <div v-else class="d-flex flex-column gap-2 mb-4" style="max-height:280px;overflow-y:auto">
          <v-card
            v-for="b in userBookings"
            :key="b.id"
            color="grey-lighten-5"
            rounded="lg"
            class="pa-3"
            flat
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <v-chip :color="statusColor(b.status)" size="x-small" label>{{ getStatusText(b.status) }}</v-chip>
              <span class="text-caption font-weight-bold text-primary">{{ (b.finalFare || b.estimatedFare)?.toLocaleString() }} تومان</span>
            </div>
            <div class="text-caption text-secondary font-weight-medium text-truncate">{{ b.pickupAddress }}</div>
            <div class="text-caption text-grey text-truncate">→ {{ b.dropoffAddress }}</div>
            <div class="text-caption text-grey mt-1">{{ new Date(b.scheduledAt).toLocaleString('fa-IR') }}</div>
          </v-card>
        </div>

        <!-- آمار رزرو این کاربر -->
        <v-card color="grey-lighten-5" rounded="lg" class="pa-4 mb-5">
          <v-row dense>
            <v-col cols="4" class="text-center">
              <div class="text-h6 font-weight-bold text-secondary">{{ userBookings.length }}</div>
              <div class="text-caption text-grey">کل</div>
            </v-col>
            <v-col cols="4" class="text-center">
              <div class="text-h6 font-weight-bold text-success">{{ userBookings.filter(b => b.status === 'completed').length }}</div>
              <div class="text-caption text-grey">تکمیل شده</div>
            </v-col>
            <v-col cols="4" class="text-center">
              <div class="text-h6 font-weight-bold text-primary">
                {{ userBookings.filter(b => b.status === 'completed').reduce((s, b) => s + parseFloat(b.finalFare || b.estimatedFare || 0), 0).toLocaleString() }} تومان
              </div>
              <div class="text-caption text-grey">هزینه کل</div>
            </v-col>
          </v-row>
        </v-card>

        <!-- تغییر وضعیت فعال/غیرفعال -->
        <v-btn
          :color="selectedUser.isActive ? 'error' : 'success'"
          variant="tonal"
          block
          :prepend-icon="selectedUser.isActive ? 'mdi-account-cancel' : 'mdi-account-check'"
          :loading="toggling"
          @click="toggleActive(selectedUser)"
        >
          {{ selectedUser.isActive ? 'معلق کردن حساب' : 'فعال کردن مجدد حساب' }}
        </v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const users = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const statusFilter = ref('all')
const detailDrawer = ref(false)
const selectedUser = ref<any>(null)
const userBookings = ref<any[]>([])
const loadingBookings = ref(false)
const toggling = ref(false)

onMounted(fetchUsers)

const getStatusText = (status: string) => ({
  pending: 'در انتظار',
  confirmed: 'تأیید شده',
  in_progress: 'در حال انجام',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
}[status] || status)

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await $api.get('/users')
    // فقط مشتریان (حذف ادمین‌ها)
    users.value = data.filter((u: any) => u.role === 'client')
  } finally { loading.value = false }
}

const filteredUsers = computed(() => {
  if (statusFilter.value === 'all') return users.value
  if (statusFilter.value === 'active') return users.value.filter((u) => u.isActive)
  return users.value.filter((u) => !u.isActive)
})

const stats = computed(() => [
  { label: 'کل مشتریان', value: users.value.length, icon: 'mdi-account-group', color: 'primary' },
  { label: 'تأیید شده', value: users.value.filter((u) => u.isVerified).length, icon: 'mdi-check-circle', color: 'success' },
  { label: 'فعال', value: users.value.filter((u) => u.isActive).length, icon: 'mdi-account-check', color: 'info' },
  { label: 'معلق', value: users.value.filter((u) => !u.isActive).length, icon: 'mdi-account-cancel', color: 'error' },
])

const headers = [
  { title: 'مشتری', key: 'fullName', sortable: true },
  { title: 'تلفن', key: 'phone', sortable: false },
  { title: 'تأیید', key: 'isVerified', sortable: true },
  { title: 'وضعیت', key: 'isActive', sortable: true },
  { title: 'تاریخ ثبت نام', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false, width: '80px' },
]

const statusColor = (s: string) =>
  ({ pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'error' }[s] || 'grey')

const openDetail = async (user: any) => {
  selectedUser.value = user
  detailDrawer.value = true
  loadingBookings.value = true
  userBookings.value = []
  try {
    const { data } = await $api.get('/bookings')
    userBookings.value = data.filter((b: any) => b.userId === user.id)
  } finally { loadingBookings.value = false }
}

const toggleActive = async (user: any) => {
  toggling.value = true
  try {
    const { data } = await $api.patch(`/users/${user.id}/toggle-active`)
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx !== -1) users.value[idx] = data
    if (selectedUser.value?.id === user.id) selectedUser.value = data
  } finally { toggling.value = false }
}
</script>