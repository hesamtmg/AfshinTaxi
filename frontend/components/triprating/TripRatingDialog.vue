<template>
  <!-- Rating prompt sheet -->
  <v-dialog v-model="show" max-width="420" persistent>
    <v-card rounded="xl" class="text-center">
      <!-- Success state -->
      <template v-if="submitted">
        <v-card-text class="pa-8">
          <v-icon size="64" color="amber" class="mb-4">mdi-star-circle</v-icon>
          <h2 class="text-h6 font-weight-bold mb-2">ممنون از نظر شما!</h2>
          <p class="text-body-2 text-medium-emphasis">
            امتیاز شما ثبت شد و به بهبود کیفیت خدمات کمک می‌کند.
          </p>
          <div class="d-flex justify-center mt-3 gap-1">
            <v-icon
              v-for="i in 5"
              :key="i"
              :color="i <= submittedStars ? 'amber' : 'grey-lighten-2'"
              size="28"
            >
              mdi-star
            </v-icon>
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn block color="primary" variant="tonal" @click="close">بستن</v-btn>
        </v-card-actions>
      </template>

      <!-- Rating input state -->
      <template v-else>
        <v-card-text class="pa-6 pb-2">
          <div class="mb-4">
            <v-avatar size="64" color="primary" class="mb-3">
              <v-icon size="32" color="white">mdi-car</v-icon>
            </v-avatar>
            <h2 class="text-h6 font-weight-bold">سفر شما چطور بود؟</h2>
            <p class="text-body-2 text-medium-emphasis mt-1">
              به راننده امتیاز دهید
            </p>
          </div>

          <!-- Star selector -->
          <div class="d-flex justify-center gap-2 mb-2">
            <button
              v-for="i in 5"
              :key="i"
              class="star-btn"
              @click="selectedStars = i"
              @mouseenter="hoverStars = i"
              @mouseleave="hoverStars = 0"
            >
              <v-icon
                :color="i <= (hoverStars || selectedStars) ? 'amber' : 'grey-lighten-2'"
                size="40"
                :class="{ 'star-active': i <= (hoverStars || selectedStars) }"
              >
                {{ i <= (hoverStars || selectedStars) ? 'mdi-star' : 'mdi-star-outline' }}
              </v-icon>
            </button>
          </div>

          <!-- Star label -->
          <div class="text-body-2 font-weight-medium mb-4" style="min-height: 20px">
            <span :style="{ color: starColor }">{{ starLabel }}</span>
          </div>

          <!-- Optional comment -->
          <v-textarea
            v-model="comment"
            label="نظر شما (اختیاری)"
            variant="outlined"
            rows="2"
            placeholder="تجربه سفر خود را بنویسید..."
            hide-details
          />
        </v-card-text>

        <v-card-actions class="pa-6 gap-2 flex-column">
          <v-btn
            block
            color="primary"
            size="large"
            :disabled="!selectedStars"
            :loading="loading"
            @click="submitRating"
          >
            ثبت امتیاز
          </v-btn>
          <v-btn block variant="text" size="small" color="grey" @click="close">
            بعداً امتیاز می‌دهم
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  bookingId: number
}>()

const emit = defineEmits(['update:modelValue', 'rated'])
const { $api } = useNuxtApp()

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const selectedStars = ref(0)
const hoverStars = ref(0)
const comment = ref('')
const loading = ref(false)
const submitted = ref(false)
const submittedStars = ref(0)

const starLabels: Record<number, string> = {
  1: 'خیلی بد',
  2: 'بد',
  3: 'متوسط',
  4: 'خوب',
  5: 'عالی',
}

const starColors: Record<number, string> = {
  1: '#f44336',
  2: '#ff7043',
  3: '#ffa726',
  4: '#66bb6a',
  5: '#26a69a',
}

const active = computed(() => hoverStars.value || selectedStars.value)
const starLabel = computed(() => active.value ? starLabels[active.value] : '')
const starColor = computed(() => active.value ? starColors[active.value] : '')

const submitRating = async () => {
  if (!selectedStars.value) return
  loading.value = true
  try {
    await $api.post('/ratings', {
        bookingId: props.bookingId,
        stars: selectedStars.value,
        comment: comment.value || undefined,
      })
    submittedStars.value = selectedStars.value
    submitted.value = true
    emit('rated', selectedStars.value)
  } catch (e: any) {
    // Already rated or other error — just close
    close()
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  // Reset after transition
  setTimeout(() => {
    selectedStars.value = 0
    hoverStars.value = 0
    comment.value = ''
    submitted.value = false
    submittedStars.value = 0
  }, 300)
}
</script>

<style scoped>
.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: transform 0.1s ease;
}
.star-btn:hover {
  transform: scale(1.15);
}
.star-active {
  filter: drop-shadow(0 0 4px rgba(255, 180, 0, 0.5));
}
</style>
