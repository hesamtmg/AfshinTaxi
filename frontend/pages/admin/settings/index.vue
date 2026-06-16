<template>
  <div>
    <div class="mb-6">
      <div class="text-h5 font-weight-bold text-secondary">Settings</div>
      <div class="text-body-2 text-grey">Configure system-wide settings</div>
    </div>

    <v-row>
      <!-- Pricing -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="primary" size="44" rounded="lg">
              <v-icon color="white">mdi-currency-usd</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">Pricing</div>
              <div class="text-caption text-grey">Fare and rate configuration</div>
            </div>
          </div>
          <v-form @submit.prevent="savePricing">
            <div class="text-caption text-grey font-weight-bold mb-3">BASE FARE SETTINGS</div>
            <v-text-field
              v-model="pricing.farePerKm"
              label="Fare Per Kilometer ($)"
              type="number"
              step="0.1"
              min="0"
              prepend-inner-icon="mdi-map-marker-distance"
              variant="outlined"
              rounded="lg"
              :hint="`Example: a 10km ride costs $${(parseFloat(pricing.farePerKm||'0')*10).toFixed(2)}`"
              persistent-hint
              class="mb-4"
            />
            <v-text-field
              v-model="pricing.baseFare"
              label="Base Fare ($ flat fee)"
              type="number"
              step="0.5"
              min="0"
              prepend-inner-icon="mdi-tag"
              variant="outlined"
              rounded="lg"
              hint="Added to every booking regardless of distance"
              persistent-hint
              class="mb-4"
            />
            <v-text-field
              v-model="pricing.minimumFare"
              label="Minimum Fare ($)"
              type="number"
              step="0.5"
              min="0"
              prepend-inner-icon="mdi-arrow-down-circle"
              variant="outlined"
              rounded="lg"
              hint="No booking can be lower than this amount"
              persistent-hint
              class="mb-5"
            />
            <!-- Fare preview -->
            <v-card color="primary" variant="tonal" rounded="lg" class="pa-4 mb-5">
              <div class="text-caption font-weight-bold text-primary mb-2">FARE PREVIEW</div>
              <v-row dense>
                <v-col v-for="ex in fareExamples" :key="ex.km" cols="4" class="text-center">
                  <div class="text-body-2 font-weight-bold text-secondary">{{ calculatedFare(ex.km) }}</div>
                  <div class="text-caption text-grey">{{ ex.km }} km</div>
                </v-col>
              </v-row>
            </v-card>
            <v-alert v-if="pricingSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="Pricing settings saved." />
            <v-alert v-if="pricingError"   type="error"   variant="tonal" rounded="lg" class="mb-3" :text="pricingError" />
            <v-btn type="submit" color="primary" block :loading="savingPricing" prepend-icon="mdi-content-save">
              Save Pricing
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <!-- Right column -->
      <v-col cols="12" md="6">

        <!-- ── Feature 2: Cancellation Policy ── -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="error" size="44" rounded="lg">
              <v-icon color="white">mdi-cancel</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">Cancellation Policy</div>
              <div class="text-caption text-grey">Control when customers can cancel</div>
            </div>
          </div>
          <v-form @submit.prevent="saveCancellation">
            <v-text-field
              v-model="cancellation.deadlineMinutes"
              label="Cancellation Deadline (minutes before trip)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-clock-alert"
              variant="outlined"
              rounded="lg"
              class="mb-2"
            />
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
              <div class="text-caption">
                <strong>{{ cancellation.deadlineMinutes }} minutes</strong> before the scheduled pickup,
                customers will no longer be able to self-cancel.
                Set to <strong>0</strong> to allow cancellations at any time.
              </div>
            </v-alert>
            <!-- Examples -->
            <v-card color="grey-lighten-5" rounded="lg" class="pa-3 mb-5">
              <div class="text-caption font-weight-bold text-grey mb-2">EXAMPLES</div>
              <div v-for="ex in cancellationExamples" :key="ex.label" class="d-flex justify-space-between text-caption py-1">
                <span class="text-grey">Trip at {{ ex.label }}</span>
                <span :class="ex.allowed ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
                  {{ ex.allowed ? '✓ Can cancel' : '✗ Cannot cancel' }}
                </span>
              </div>
            </v-card>
            <v-alert v-if="cancellationSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="Cancellation policy saved." />
            <v-btn type="submit" color="error" block :loading="savingCancellation" prepend-icon="mdi-content-save">
              Save Policy
            </v-btn>
          </v-form>
        </v-card>

        <!-- ── Feature 3: Driver Availability Buffer ── -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="info" size="44" rounded="lg">
              <v-icon color="white">mdi-car-clock</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">Driver Availability</div>
              <div class="text-caption text-grey">Conflict detection buffer window</div>
            </div>
          </div>
          <v-form @submit.prevent="saveDriverBuffer">
            <v-text-field
              v-model="driverBuffer.minutes"
              label="Buffer Window (minutes)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-timer-sand"
              variant="outlined"
              rounded="lg"
              class="mb-2"
            />
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
              <div class="text-caption">
                When assigning a driver, the system checks for existing bookings within
                <strong>±{{ driverBuffer.minutes }} minutes</strong> of the new trip's scheduled time.
                If a conflict is found, the driver cannot be assigned.
              </div>
            </v-alert>
            <!-- Visual buffer example -->
            <v-card color="grey-lighten-5" rounded="lg" class="pa-3 mb-5">
              <div class="text-caption font-weight-bold text-grey mb-2">HOW IT WORKS</div>
              <div class="d-flex align-center gap-2 text-caption">
                <v-icon color="error" size="14">mdi-block-helper</v-icon>
                <span class="text-grey">Blocked zone:</span>
                <v-chip size="x-small" color="error" variant="tonal">-{{ driverBuffer.minutes }}min</v-chip>
                <span class="text-grey">to</span>
                <v-chip size="x-small" color="primary" variant="tonal">Trip time</v-chip>
                <span class="text-grey">to</span>
                <v-chip size="x-small" color="error" variant="tonal">+{{ driverBuffer.minutes }}min</v-chip>
              </div>
            </v-card>
            <v-alert v-if="bufferSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="Driver buffer setting saved." />
            <v-btn type="submit" color="info" block :loading="savingBuffer" prepend-icon="mdi-content-save">
              Save Buffer
            </v-btn>
          </v-form>
        </v-card>

        <!-- General settings -->
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="secondary" size="44" rounded="lg">
              <v-icon color="white">mdi-cog</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">General</div>
              <div class="text-caption text-grey">Booking and notification settings</div>
            </div>
          </div>
          <v-form @submit.prevent="saveGeneral">
            <div class="text-caption text-grey font-weight-bold mb-3">BOOKING</div>
            <v-text-field v-model="general.minAdvanceMinutes" label="Min Advance Booking (minutes)" type="number" min="0" prepend-inner-icon="mdi-clock-fast" variant="outlined" rounded="lg" class="mb-3" />
            <v-text-field v-model="general.maxPassengers" label="Max Passengers" type="number" min="1" max="20" prepend-inner-icon="mdi-account-group" variant="outlined" rounded="lg" class="mb-3" />
            <v-divider class="mb-4" />
            <div class="text-caption text-grey font-weight-bold mb-3">NOTIFICATIONS</div>
            <v-switch v-model="general.smsOnBooking" label="SMS on new booking" color="primary" hide-details class="mb-2" />
            <v-switch v-model="general.smsOnDriverAssigned" label="SMS when driver assigned" color="primary" hide-details class="mb-4" />
            <v-alert v-if="generalSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="General settings saved." />
            <v-btn type="submit" color="secondary" block :loading="savingGeneral" prepend-icon="mdi-content-save">Save Settings</v-btn>
          </v-form>
        </v-card>

        <!-- All settings raw view -->
        <v-card rounded="xl" class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary">All Settings</div>
            <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-refresh" @click="loadSettings">Refresh</v-btn>
          </div>
          <v-data-table :headers="settingsHeaders" :items="allSettings" :loading="loadingSettings" density="compact" hide-default-footer>
            <template #item.value="{ item }">
              <code class="text-primary">{{ item.value }}</code>
            </template>
            <template #item.updatedAt="{ item }">
              <span class="text-caption text-grey">{{ new Date(item.updatedAt).toLocaleDateString() }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { $api } = useNuxtApp()

const allSettings    = ref<any[]>([])
const loadingSettings = ref(false)

const pricing     = ref({ farePerKm: '1.5', baseFare: '0', minimumFare: '3' })
const cancellation = ref({ deadlineMinutes: '60' })
const driverBuffer = ref({ minutes: '60' })
const general     = ref({ minAdvanceMinutes: '30', maxPassengers: '8', smsOnBooking: true, smsOnDriverAssigned: true })

const savingPricing      = ref(false)
const savingCancellation = ref(false)
const savingBuffer       = ref(false)
const savingGeneral      = ref(false)

const pricingSuccess      = ref(false)
const cancellationSuccess = ref(false)
const bufferSuccess       = ref(false)
const generalSuccess      = ref(false)
const pricingError        = ref('')

const fareExamples = [{ km: 5 }, { km: 10 }, { km: 20 }]

const calculatedFare = (km: number) => {
  const base  = parseFloat(pricing.value.baseFare   || '0')
  const perKm = parseFloat(pricing.value.farePerKm  || '0')
  const min   = parseFloat(pricing.value.minimumFare || '0')
  return `$${Math.max(base + km * perKm, min).toFixed(2)}`
}

// Show live cancellation examples based on current deadline setting
const cancellationExamples = computed(() => {
  const deadline = parseInt(cancellation.value.deadlineMinutes || '0')
  return [
    { label: `now + ${deadline + 30} min`, allowed: true },
    { label: `now + ${deadline} min`,      allowed: false },
    { label: `now + ${Math.max(0, deadline - 30)} min`, allowed: false },
  ]
})

const settingsHeaders = [
  { title: 'Key',     key: 'key',       sortable: true },
  { title: 'Value',   key: 'value',     sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true },
]

onMounted(loadSettings)

async function loadSettings() {
  loadingSettings.value = true
  try {
    const { data } = await $api.get('/settings')
    allSettings.value = data
    const get = (key: string, fb: string) => data.find((s: any) => s.key === key)?.value ?? fb
    pricing.value.farePerKm           = get('fare_per_km', '1.5')
    pricing.value.baseFare            = get('base_fare', '0')
    pricing.value.minimumFare         = get('minimum_fare', '3')
    cancellation.value.deadlineMinutes = get('cancellation_deadline_minutes', '60')
    driverBuffer.value.minutes        = get('driver_buffer_minutes', '60')
    general.value.minAdvanceMinutes   = get('min_advance_minutes', '30')
    general.value.maxPassengers       = get('max_passengers', '8')
    general.value.smsOnBooking        = get('sms_on_booking', 'true') === 'true'
    general.value.smsOnDriverAssigned = get('sms_on_driver_assigned', 'true') === 'true'
  } finally { loadingSettings.value = false }
}

const saveSetting = (key: string, value: string, description?: string) =>
  $api.put('/settings', { key, value, description })

const flash = (ref: Ref<boolean>) => { ref.value = true; setTimeout(() => { ref.value = false }, 3000) }

const savePricing = async () => {
  savingPricing.value = true; pricingError.value = ''
  try {
    await Promise.all([
      saveSetting('fare_per_km',   pricing.value.farePerKm,  'Fare charged per kilometer ($)'),
      saveSetting('base_fare',     pricing.value.baseFare,   'Flat base fare per booking ($)'),
      saveSetting('minimum_fare',  pricing.value.minimumFare,'Minimum fare per booking ($)'),
    ])
    flash(pricingSuccess); await loadSettings()
  } catch (e: any) { pricingError.value = e.response?.data?.message || 'Failed to save' }
  finally { savingPricing.value = false }
}

const saveCancellation = async () => {
  savingCancellation.value = true
  try {
    await saveSetting('cancellation_deadline_minutes', cancellation.value.deadlineMinutes, 'Minutes before trip when customer cancellation is blocked (0 = always allowed)')
    flash(cancellationSuccess); await loadSettings()
  } finally { savingCancellation.value = false }
}

const saveDriverBuffer = async () => {
  savingBuffer.value = true
  try {
    await saveSetting('driver_buffer_minutes', driverBuffer.value.minutes, 'Buffer window in minutes for driver availability conflict detection')
    flash(bufferSuccess); await loadSettings()
  } finally { savingBuffer.value = false }
}

const saveGeneral = async () => {
  savingGeneral.value = true
  try {
    await Promise.all([
      saveSetting('min_advance_minutes',       general.value.minAdvanceMinutes, 'Minimum booking advance time (minutes)'),
      saveSetting('max_passengers',            general.value.maxPassengers,     'Maximum passengers per booking'),
      saveSetting('sms_on_booking',            String(general.value.smsOnBooking),         'Send SMS on new booking'),
      saveSetting('sms_on_driver_assigned',    String(general.value.smsOnDriverAssigned),  'Send SMS when driver assigned'),
    ])
    flash(generalSuccess); await loadSettings()
  } finally { savingGeneral.value = false }
}
</script>
