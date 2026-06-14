<template>
  <v-app>
    <v-app-bar color="transparent" elevation="0" class="px-4" absolute>
      <div class="d-flex align-center">
        <v-icon color="primary" size="28" class="mr-2">mdi-taxi</v-icon>
        <span class="text-h6 font-weight-bold" style="color: #1a1a2e">افشین‌تاکسی</span>
      </div>
      <v-spacer />
      <v-btn variant="text" to="/auth/login" class="mr-2">ورود</v-btn>
      <v-btn color="primary" to="/auth/register">شروع کنید</v-btn>
    </v-app-bar>

    <!-- بخش اصلی -->
    <section class="hero-section d-flex align-center" style="min-height: 100vh">
      <v-container style="direction: rtl !important;">
        <v-row align="center">
          <v-col cols="12" md="6">
            <div class="text-overline text-primary font-weight-bold mb-3">
              رزرو از قبل
            </div>
            <h1
              class="text-h2 font-weight-bold text-secondary mb-4"
              style="line-height: 1.2"
            >
              شهر شما.<br />
              <span class="text-primary">تاکسی شما.</span><br />
              طبق برنامه شما.
            </h1>
            <p class="text-body-1 text-grey-darken-1 mb-8" style="max-width: 420px">
              تاکسی خود را از قبل رزرو کنید، وضعیت سفر را پیگیری کنید و با اطمینان سفر
              کنید. رانندگان حرفه‌ای، قیمت‌گذاری شفاف.
            </p>
            <div class="d-flex gap-4 flex-wrap">
              <v-btn
                color="primary"
                size="x-large"
                to="/auth/register"
                prepend-icon="mdi-taxi"
              >
                رزرو تاکسی
              </v-btn>
              <v-btn variant="outlined" color="secondary" size="x-large" to="/auth/login">
                ورود
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
                <div class="text-h5 font-weight-bold mb-2">رزرو آسان</div>
                <div class="text-body-2 opacity-80">مبدا، مقصد و زمان را مشخص کنید</div>
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

    <!-- ویژگی‌ها -->
    <section class="py-16 bg-grey-lighten-5">
      <v-container>
        <div class="text-center mb-12">
          <div class="text-h4 font-weight-bold text-secondary">چرا افشین‌تاکسی؟</div>
        </div>
        <v-row>
          <v-col v-for="feature in features" :key="feature.title" cols="12" md="4">
            <v-card class="pa-6 h-100" rounded="xl">
              <v-icon :color="feature.color" size="40" class="mb-4">{{
                feature.icon
              }}</v-icon>
              <div class="text-h6 font-weight-bold text-secondary mb-2">
                {{ feature.title }}
              </div>
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
  { value: "۵۰۰+", label: "راننده" },
  { value: "۱۰هزار+", label: "سفر" },
  { value: "۴.۹★", label: "امتیاز" },
];

const features = [
  {
    icon: "mdi-calendar-check",
    color: "primary",
    title: "رزرو از قبل",
    desc:
      "سفر خود را ساعت‌ها یا روزها قبل برنامه‌ریزی کنید. هیچ وقت قرار مهمی را از دست ندهید.",
  },
  {
    icon: "mdi-map-marker",
    color: "success",
    title: "انتخاب روی نقشه",
    desc: "مکان دقیق سوار و پیاده شدن را روی نقشه تعاملی مشخص کنید.",
  },
  {
    icon: "mdi-shield-check",
    color: "info",
    title: "رانندگان تأیید شده",
    desc: "همه رانندگان بررسی و تأیید شده‌اند. با خیال راحت و با افراد حرفه‌ای سفر کنید.",
  },
];
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #ffffff 0%, #fff8ee 100%);
}
</style>
