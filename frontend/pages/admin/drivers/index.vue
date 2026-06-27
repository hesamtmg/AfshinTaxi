<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold text-secondary">Drivers</div>
        <div class="text-body-2 text-grey">Manage your driver fleet</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add Driver</v-btn>
    </div>

    <!-- Stats row -->
    <v-row class="mb-6">
      <v-col v-for="stat in driverStats" :key="stat.label" cols="6" md="3">
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

    <!-- Filter + Search -->
    <v-card rounded="xl" class="pa-0">
      <div class="pa-4 d-flex align-center gap-3">
        <v-text-field
          v-model="search"
          placeholder="Search by name, phone, plate..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded="lg"
          hide-details
          density="compact"
          style="max-width:320px"
        />
        <v-btn-toggle v-model="statusFilter" color="primary" density="compact" rounded="lg" variant="outlined">
          <v-btn value="all" size="small">All</v-btn>
          <v-btn value="active" size="small">Active</v-btn>
          <v-btn value="inactive" size="small">Inactive</v-btn>
          <v-btn value="suspended" size="small">Suspended</v-btn>

        </v-btn-toggle>
        <v-spacer />
        <v-btn-toggle v-model="viewMode" color="primary" density="compact" rounded="lg" variant="outlined">
          <v-btn icon="mdi-view-grid" value="grid" size="small" />
          <v-btn icon="mdi-view-list" value="list" size="small" />
        </v-btn-toggle>
      </div>

      <!-- Grid View -->
      <v-container v-if="viewMode === 'grid'" fluid class="pa-4">
        <v-row>
          <v-col v-for="driver in filteredDrivers" :key="driver.id" cols="12" sm="6" md="4" lg="3">
            <v-card rounded="xl" class="driver-card pa-5">
              <!-- Status indicator -->
              <div class="d-flex justify-end mb-3">
                <v-chip :color="driverStatusColor(driver.status)" size="x-small" label>
                  {{ driver.status }}
                </v-chip>
              </div>

              <!-- Avatar + name -->
              <div class="text-center mb-4">
                <v-avatar color="primary" size="64" class="mb-3">
                    <v-img v-if="driver.avatarUrl" :src="avatarSrc(driver.avatarUrl)" cover />
                    <avatar-upload v-else :token="adminToken" :endpoint="'/upload/avatar/driver/'+driver.id" :driver-id="driver.id" :admin-token="adminToken" @uploaded="onDriverAvatarUploaded">
                      <span class="text-body-2 font-weight-bold text-white">{{ driver.fullName?.charAt(0) }}</span>
           
                    </avatar-upload>
                      <v-btn v-if="driver.avatarUrl" size="small" icon="mdi-trash"  color="transparent" class="flex-1 mt-5" style="position: absolute;" @click="confirmAvatarDelete(driver)">
                            <v-icon size="30" color="red">mdi-close</v-icon>
                        </v-btn>
              
                </v-avatar>
                <div class="text-body-1 font-weight-bold text-secondary">{{ driver.fullName }}</div>
                <div class="text-caption text-grey">{{ driver.phone }}</div>
              </div>

              <v-divider class="mb-3" />

              <!-- Car info -->
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon size="16" color="grey">mdi-car</v-icon>
                <span class="text-body-2 text-secondary">{{ driver.carModel }}</span>
                <span v-if="driver.carColor" class="text-caption text-grey">({{ driver.carColor }})</span>
              </div>
              <div class="d-flex align-center gap-2 mb-4">
               <IranLicensePlate :plate="driver.carPlate" />
              </div>

              <!-- Actions -->
              <div class="d-flex gap-2">
                <v-btn size="small" variant="tonal" color="primary" class="flex-1" @click="openEdit(driver)">
                  Edit
                </v-btn>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="tonal" />
                  </template>
                  <v-list rounded="lg" min-width="160">
                    <v-list-item
                      v-for="action in driverActions(driver)"
                      :key="action.label"
                      :title="action.label"
                      :prepend-icon="action.icon"
                      :base-color="action.color"
                      @click="handleDriverAction(driver, action.action)"
                    />
                  </v-list>
                </v-menu>
              </div>
            </v-card>
          </v-col>
          <v-col v-if="filteredDrivers.length === 0" cols="12">
            <div class="text-center pa-16">
              <v-icon size="72" color="grey-lighten-2" class="mb-4">mdi-car-off</v-icon>
              <div class="text-h6 text-grey">No drivers found</div>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- List View -->
      <v-data-table
        v-else
        :headers="headers"
        :items="filteredDrivers"
        :loading="loading"
        hover
      >
        <template #item.fullName="{ item }">
          <div class="d-flex align-center gap-2 py-2">
            <v-avatar color="primary" size="36">
          
                 <v-img v-if="item.avatarUrl" :src="avatarSrc(item.avatarUrl)" cover />
                    <avatar-upload v-else :token="adminToken" :endpoint="'/upload/avatar/driver/'+item.id" :driver-id="item.id" :admin-token="adminToken" @uploaded="onDriverAvatarUploaded">
                      <span class="text-body-2 font-weight-bold text-white">{{ item.fullName?.charAt(0) }}</span>
           
                    </avatar-upload>
                      <v-btn v-if="item.avatarUrl" size="small" icon="mdi-trash"  color="transparent" class="flex-1 mt-5" style="position: absolute;" @click="confirmAvatarDelete(item)">
                            <v-icon size="30" color="red">mdi-close</v-icon>
                        </v-btn>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.fullName }}</div>
              <div class="text-caption text-grey">{{ item.phone }}</div>
            </div>
          </div>
        </template>
        <template #item.carModel="{ item }">
          <div class="text-body-2">{{ item.carModel }}</div>
          <div class="text-caption text-grey">{{ item.carColor }}</div>
        </template>
        <template #item.carPlate="{ item }">
          <div class="pa-2">
         <IranLicensePlate  :plate="item.carPlate" />
          </div>
  
        </template>
        <template #item.status="{ item }">
          <v-chip :color="driverStatusColor(item.status)" size="small" label>{{ item.status }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="540" persistent>
      <v-card rounded="xl" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-5">
          <div class="text-h6 font-weight-bold text-secondary">
            {{ editingDriver ? 'Edit Driver' : 'Add New Driver' }}
          </div>
          <v-btn icon="mdi-close" variant="text" @click="formDialog = false" />
        </div>

        <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="driverForm.fullName" label="Full Name" :rules="[rules.required]" prepend-inner-icon="mdi-account" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="driverForm.phone" label="Phone" :rules="[rules.required]" prepend-inner-icon="mdi-phone" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="driverForm.email" label="Email (optional)" prepend-inner-icon="mdi-email" />
            </v-col>
            <v-col cols="12">
              <v-divider class="mb-2" />
              <div class="text-caption text-grey font-weight-bold mb-2">VEHICLE INFORMATION</div>
            </v-col>
            <v-col cols="12" sm="12">
              <v-text-field v-model="driverForm.carModel" label="Car Model" :rules="[rules.required]" prepend-inner-icon="mdi-car" />
            </v-col>
            <v-col cols="12" sm="12">
              <IranLicensePlateInput  v-model="driverForm.carPlate"></IranLicensePlateInput>

            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="driverForm.carColor" label="Car Color" prepend-inner-icon="mdi-palette" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="driverForm.carYear" label="Car Year" prepend-inner-icon="mdi-calendar" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="driverForm.licenseNumber" label="Driver License No." prepend-inner-icon="mdi-card-account-details" />
            </v-col>
          </v-row>

          <v-alert v-if="formError" type="error" variant="tonal" rounded="lg" class="mb-4" :text="formError" />

          <div class="d-flex gap-3 mt-2">
            <v-btn variant="outlined" color="secondary" block @click="formDialog = false">Cancel</v-btn>
            <v-btn type="submit" color="primary" block :loading="formLoading" :disabled="!formValid">
              {{ editingDriver ? 'Save Changes' : 'Add Driver' }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon color="error" size="48" class="mb-3">mdi-delete-alert</v-icon>
        <div class="text-h6 font-weight-bold text-secondary mb-2">Delete Driver?</div>
        <div class="text-body-2 text-grey mb-5">
          <strong>{{ deleteTarget?.fullName }}</strong> will be permanently removed.
        </div>
        <div class="d-flex gap-3">
          <v-btn variant="outlined" color="secondary" block @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" block :loading="deleting" @click="doDelete">Delete</v-btn>
        </div>
      </v-card>
          <!-- Delete Avatar Confirm -->
    </v-dialog>
        <v-dialog v-model="deleteAvatarDialog" max-width="360">
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon color="error" size="48" class="mb-3">mdi-delete-alert</v-icon>
        <div class="text-h6 font-weight-bold text-secondary mb-2">Delete Driver Avatar?</div>
        <div class="text-body-2 text-grey mb-5">
          <strong>The avatar</strong> will be permanently removed.
        </div>
        <div class="d-flex gap-3">
          <v-btn variant="outlined" color="secondary" block @click="deleteAvatarDialog = false">Cancel</v-btn>
          <v-btn color="error" block :loading="deleting" @click="doAvatarDelete">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">

import AvatarUpload from '~/common/AvatarUpload.vue'
import IranLicensePlateInput from '~/components/driver/IranLicensePlateInput.vue'
import IranLicensePlate from '~/components/driver/IranLicensePlate.vue'
definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const loading = ref(false)
const drivers = ref<any[]>([])
const search = ref('')
const statusFilter = ref('all')
const viewMode = ref('grid')

const formDialog = ref(false)
const formValid = ref(false)
const formLoading = ref(false)
const formError = ref('')
const editingDriver = ref<any>(null)
const form = ref()

const deleteDialog = ref(false)
const deleteTarget = ref<any>(null)
const deleting = ref(false)

const deleteAvatarDialog = ref(false)
const deleteAvatarTarget = ref<any>(null)

const emptyForm = () => ({
  fullName: '', phone: '', email: '',
  carModel: '', carPlate: '', carColor: '', carYear: '', licenseNumber: '',
})
const driverForm = ref(emptyForm())

const rules = { required: (v: string) => !!v || 'Required' }

const config     = useRuntimeConfig()
const authStore  = useAuthStore()
const adminToken = computed(() => authStore.token)

const getAvatarSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${config.public.apiBase.replace('/api', '')}${url}`
}

onMounted(fetchDrivers)

async function fetchDrivers() {
  loading.value = true
  try { const { data } = await $api.get('/drivers'); drivers.value = data }
  finally { loading.value = false }
}

const filteredDrivers = computed(() => {
  let list = drivers.value
  if (statusFilter.value !== 'all') list = list.filter((d) => d.status === statusFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((d) => d.fullName?.toLowerCase().includes(q) || d.phone?.includes(q) || d.carPlate?.toLowerCase().includes(q))
  }
  return list
})

const driverStats = computed(() => [
  { label: 'Total', value: drivers.value.length, icon: 'mdi-account-group', color: 'secondary' },
  { label: 'Active', value: drivers.value.filter((d) => d.status === 'active').length, icon: 'mdi-check-circle', color: 'success' },
  { label: 'Inactive', value: drivers.value.filter((d) => d.status === 'inactive').length, icon: 'mdi-pause-circle', color: 'warning' },
  { label: 'Suspended', value: drivers.value.filter((d) => d.status === 'suspended').length, icon: 'mdi-cancel', color: 'error' },
])

const driverStatusColor = (s: string) =>
  ({ active: 'success', inactive: 'warning', suspended: 'error' }[s] || 'grey')

const driverActions = (driver: any) => {
  const actions = []
  if (driver.status !== 'active') actions.push({ label: 'Set Active', icon: 'mdi-check-circle', color: 'success', action: 'activate' })
  if (driver.status !== 'inactive') actions.push({ label: 'Set Inactive', icon: 'mdi-pause-circle', color: 'warning', action: 'deactivate' })
  if (driver.status !== 'suspended') actions.push({ label: 'Suspend', icon: 'mdi-cancel', color: 'error', action: 'suspend' })
  actions.push({ label: 'Delete', icon: 'mdi-delete', color: 'error', action: 'delete' })
  return actions
}

const handleDriverAction = async (driver: any, action: string) => {
  if (action === 'delete') { confirmDelete(driver); return }
  const statusMap: Record<string, string> = { activate: 'active', deactivate: 'inactive', suspend: 'suspended' }
  await $api.patch(`/drivers/${driver.id}/status`, { status: statusMap[action] })
  await fetchDrivers()
}

const headers = [
  { title: 'Driver', key: 'fullName', sortable: true },
  { title: 'Car Model', key: 'carModel', sortable: true },
  { title: 'Plate', key: 'carPlate', sortable: true },
  { title: 'License', key: 'licenseNumber', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: '', key: 'actions', sortable: false },
]

const openCreate = () => {
  editingDriver.value = null; driverForm.value = emptyForm(); formError.value = ''; formDialog.value = true
}

const editingDriverAvatar = ref('')


const avatarSrc = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = useRuntimeConfig().public.apiBase.replace('/api', '')
  return `${base}${url}`
}

const onDriverAvatarUploaded = (updatedDriver: any) => {
  editingDriverAvatar.value = updatedDriver.avatarUrl
  // Update the driver in local list
  const idx = drivers.value.findIndex((d) => d.id === editingDriver.value?.id)
  if (idx !== -1) drivers.value[idx] = { ...drivers.value[idx], avatarUrl: updatedDriver.avatarUrl }
 fetchDrivers()
}

const openEdit = (driver: any) => {
  editingDriver.value = driver
  editingDriverAvatar.value = driver.avatarUrl || ''
  driverForm.value = { fullName: driver.fullName, phone: driver.phone, email: driver.email || '', carModel: driver.carModel, carPlate: driver.carPlate, carColor: driver.carColor || '', carYear: driver.carYear || '', licenseNumber: driver.licenseNumber || '' }
  formError.value = ''; formDialog.value = true
}

const submitForm = async () => {
  formLoading.value = true; formError.value = ''
  try {
    if (editingDriver.value) {
      await $api.patch(`/drivers/${editingDriver.value.id}`, driverForm.value)
    } else {
      await $api.post('/drivers', driverForm.value)
    }
    formDialog.value = false
    await fetchDrivers()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Failed to save driver'
  } finally { formLoading.value = false }
}

const confirmAvatarDelete = (driver: any) => { deleteAvatarTarget.value = driver; deleteAvatarDialog.value = true }

const doAvatarDelete = async () => {
  deleting.value = true
  try { await $api.delete(`/upload/avatar/driver/${deleteAvatarTarget.value.id}`); deleteAvatarDialog.value = false; await fetchDrivers() }
  finally { deleting.value = false }
}

const confirmDelete = (driver: any) => { deleteTarget.value = driver; deleteDialog.value = true }

const doDelete = async () => {
  deleting.value = true
  try { await $api.delete(`/drivers/${deleteTarget.value.id}`); deleteDialog.value = false; await fetchDrivers() }
  finally { deleting.value = false }
}
</script>

<style scoped>
.driver-card { transition: transform 0.15s, box-shadow 0.15s; }
.driver-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
</style>
