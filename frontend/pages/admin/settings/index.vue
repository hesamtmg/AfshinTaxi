<template>
  <div>
    <div class="mb-6">
      <div class="text-h5 font-weight-bold text-secondary">Settings</div>
      <div class="text-body-2 text-grey">Configure system-wide settings</div>
    </div>

    <v-row>
      <!-- Pricing Settings -->
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
              :hint="`Example: a 10km ride will cost $${(parseFloat(pricing.farePerKm || '0') * 10).toFixed(2)}`"
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

            <v-alert v-if="pricingSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="Pricing settings saved successfully." />
            <v-alert v-if="pricingError" type="error" variant="tonal" rounded="lg" class="mb-3" :text="pricingError" />

            <v-btn type="submit" color="primary" block :loading="savingPricing" prepend-icon="mdi-content-save">
              Save Pricing
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <!-- General Settings -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" class="pa-6 mb-4">
          <div class="d-flex align-center gap-3 mb-5">
            <v-avatar color="secondary" size="44" rounded="lg">
              <v-icon color="white">mdi-cog</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-secondary">General</div>
              <div class="text-caption text-grey">Application settings</div>
            </div>
          </div>

          <v-form @submit.prevent="saveGeneral">
            <div class="text-caption text-grey font-weight-bold mb-3">BOOKING SETTINGS</div>

            <v-text-field
              v-model="general.minAdvanceMinutes"
              label="Minimum Advance Booking (minutes)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-clock-fast"
              variant="outlined"
              rounded="lg"
              hint="How early in advance a booking must be made"
              persistent-hint
              class="mb-4"
            />

            <v-text-field
              v-model="general.maxPassengers"
              label="Max Passengers Per Booking"
              type="number"
              min="1"
              max="20"
              prepend-inner-icon="mdi-account-group"
              variant="outlined"
              rounded="lg"
              class="mb-4"
            />

            <v-divider class="mb-4" />
            <div class="text-caption text-grey font-weight-bold mb-3">NOTIFICATIONS</div>

            <v-switch
              v-model="general.smsOnBooking"
              label="SMS on new booking"
              color="primary"
              hide-details
              class="mb-2"
            />
            <v-switch
              v-model="general.smsOnDriverAssigned"
              label="SMS when driver assigned"
              color="primary"
              hide-details
              class="mb-4"
            />

            <v-alert v-if="generalSuccess" type="success" variant="tonal" rounded="lg" class="mb-3" text="General settings saved." />

            <v-btn type="submit" color="secondary" block :loading="savingGeneral" prepend-icon="mdi-content-save">
              Save Settings
            </v-btn>
          </v-form>
        </v-card>

        <!-- All Settings Raw View -->
        <v-card rounded="xl" class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-secondary">All Settings</div>
            <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-refresh" @click="loadSettings">
              Refresh
            </v-btn>
          </div>
          <v-data-table
            :headers="settingsHeaders"
            :items="allSettings"
            :loading="loadingSettings"
            density="compact"
            hide-default-footer
          >
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

const allSettings = ref<any[]>([])
const loadingSettings = ref(false)

// Pricing
const pricing = ref({ farePerKm: '1.5', baseFare: '0', minimumFare: '3' })
const savingPricing = ref(false)
const pricingSuccess = ref(false)
const pricingError = ref('')

// General
const general = ref({ minAdvanceMinutes: '30', maxPassengers: '8', smsOnBooking: true, smsOnDriverAssigned: true })
const savingGeneral = ref(false)
const generalSuccess = ref(false)

const fareExamples = [{ km: 5 }, { km: 10 }, { km: 20 }]

const calculatedFare = (km: number) => {
  const base = parseFloat(pricing.value.baseFare || '0')
  const perKm = parseFloat(pricing.value.farePerKm || '0')
  const min = parseFloat(pricing.value.minimumFare || '0')
  const fare = Math.max(base + km * perKm, min)
  return `$${fare.toFixed(2)}`
}

const settingsHeaders = [
  { title: 'Key', key: 'key', sortable: true },
  { title: 'Value', key: 'value', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true },
]

onMounted(loadSettings)

async function loadSettings() {
  loadingSettings.value = true
  try {
    const { data } = await $api.get('/settings')
    allSettings.value = data

    const get = (key: string, fallback: string) => data.find((s: any) => s.key === key)?.value ?? fallback
    pricing.value.farePerKm = get('fare_per_km', '1.5')
    pricing.value.baseFare = get('base_fare', '0')
    pricing.value.minimumFare = get('minimum_fare', '3')
    general.value.minAdvanceMinutes = get('min_advance_minutes', '30')
    general.value.maxPassengers = get('max_passengers', '8')
    general.value.smsOnBooking = get('sms_on_booking', 'true') === 'true'
    general.value.smsOnDriverAssigned = get('sms_on_driver_assigned', 'true') === 'true'
  } finally { loadingSettings.value = false }
}

const saveSetting = (key: string, value: string, description?: string) =>
  $api.put('/settings', { key, value, description })

const savePricing = async () => {
  savingPricing.value = true; pricingSuccess.value = false; pricingError.value = ''
  try {
    await Promise.all([
      saveSetting('fare_per_km', pricing.value.farePerKm, 'Fare charged per kilometer'),
      saveSetting('base_fare', pricing.value.baseFare, 'Flat base fare per booking'),
      saveSetting('minimum_fare', pricing.value.minimumFare, 'Minimum fare per booking'),
    ])
    pricingSuccess.value = true
    await loadSettings()
    setTimeout(() => { pricingSuccess.value = false }, 3000)
  } catch (e: any) {
    pricingError.value = e.response?.data?.message || 'Failed to save pricing'
  } finally { savingPricing.value = false }
}

const saveGeneral = async () => {
  savingGeneral.value = true; generalSuccess.value = false
  try {
    await Promise.all([
      saveSetting('min_advance_minutes', general.value.minAdvanceMinutes, 'Minimum booking advance time in minutes'),
      saveSetting('max_passengers', general.value.maxPassengers, 'Maximum passengers allowed per booking'),
      saveSetting('sms_on_booking', String(general.value.smsOnBooking), 'Send SMS notification on new booking'),
      saveSetting('sms_on_driver_assigned', String(general.value.smsOnDriverAssigned), 'Send SMS when driver is assigned'),
    ])
    generalSuccess.value = true
    await loadSettings()
    setTimeout(() => { generalSuccess.value = false }, 3000)
  } finally { savingGeneral.value = false }
}
</script>
