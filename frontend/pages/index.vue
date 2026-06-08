<template>
  <v-app>
    <v-app-bar color="transparent" elevation="0" class="px-4" absolute>
      <div class="d-flex align-center">
        <v-icon color="primary" size="28" class="mr-2">mdi-taxi</v-icon>
        <span class="text-h6 font-weight-bold" style="color: #1A1A2E">AfshinTaxi</span>
      </div>
      <v-spacer />
      <v-btn variant="text" to="/auth/login" class="mr-2">Login</v-btn>
      <v-btn color="primary" to="/auth/register">Get Started</v-btn>
    </v-app-bar>

    <!-- Hero -->
    <section class="hero-section d-flex align-center" style="min-height: 100vh">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <div class="text-overline text-primary font-weight-bold mb-3">
              Pre-Book Your Ride
            </div>
            <h1 class="text-h2 font-weight-bold text-secondary mb-4" style="line-height:1.2">
              Your City.<br />
              <span class="text-primary">Your Taxi.</span><br />
              On Your Schedule.
            </h1>
            <p class="text-body-1 text-grey-darken-1 mb-8" style="max-width: 420px">
              Book a taxi in advance, track your ride status, and travel with confidence.
              Professional drivers, transparent pricing.
            </p>
            <div class="d-flex gap-4 flex-wrap">
              <v-btn color="primary" size="x-large" to="/auth/register" prepend-icon="mdi-taxi">
                Book a Ride
              </v-btn>
              <v-btn variant="outlined" color="secondary" size="x-large" to="/auth/login">
                Sign In
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="d-flex justify-center">
            <v-card
              color="primary"
              rounded="xl"
              class="pa-8 text-white"
              style="max-width: 380px; width: 100%"
            >
              <div class="text-center mb-6">
                <v-icon size="80" class="mb-4">mdi-taxi</v-icon>
                <div class="text-h5 font-weight-bold mb-2">Easy Booking</div>
                <div class="text-body-2 opacity-80">Set pickup, dropoff, and time</div>
              </div>
              <v-divider color="white" opacity="0.3" class="mb-6" />
              <v-row>
                <v-col
                  v-for="stat in stats"
                  :key="stat.label"
                  cols="4"
                  class="text-center"
                >
                  <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
                  <div class="text-caption opacity-80">{{ stat.label }}</div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Features -->
    <section class="py-16 bg-grey-lighten-5">
      <v-container>
        <div class="text-center mb-12">
          <div class="text-h4 font-weight-bold text-secondary">Why AfshinTaxi?</div>
        </div>
        <v-row>
          <v-col
            v-for="feature in features"
            :key="feature.title"
            cols="12"
            md="4"
          >
            <v-card class="pa-6 h-100" rounded="xl">
              <v-icon :color="feature.color" size="40" class="mb-4">{{ feature.icon }}</v-icon>
              <div class="text-h6 font-weight-bold text-secondary mb-2">{{ feature.title }}</div>
              <div class="text-body-2 text-grey-darken-1">{{ feature.desc }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </v-app>
</template>

<script setup lang="ts">
const stats = [
  { value: '500+', label: 'Drivers' },
  { value: '10K+', label: 'Trips' },
  { value: '4.9★', label: 'Rating' },
]

const features = [
  {
    icon: 'mdi-calendar-check',
    color: 'primary',
    title: 'Pre-Book in Advance',
    desc: 'Schedule your ride hours or days ahead. Never miss an important appointment.',
  },
  {
    icon: 'mdi-map-marker',
    color: 'success',
    title: 'Map-Based Pickup',
    desc: 'Easily pin your exact pickup and dropoff locations on an interactive map.',
  },
  {
    icon: 'mdi-shield-check',
    color: 'info',
    title: 'Verified Drivers',
    desc: 'All drivers are vetted and verified. Travel safely with trusted professionals.',
  },
]
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #ffffff 0%, #fff8ee 100%);
}
</style>
