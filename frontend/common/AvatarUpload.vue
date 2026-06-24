<template>
  <div class="avatar-upload-wrapper" style="direction: rtl">
    <!-- Avatar display + click to change -->
    <div class="avatar-container" @click="triggerFileInput">
      <!-- Image avatar -->
      <v-avatar :size="size" :color="currentAvatar ? 'transparent' : color" class="avatar-img">
        <v-img
          v-if="currentAvatar"
          :src="avatarSrc"
          cover
          :alt="label"
        >
          <template #error>
            <!-- Fallback to initials if image fails -->
            <span :class="initialsClass" class="font-weight-bold text-white">{{ initials }}</span>
          </template>
        </v-img>
        <span v-else :class="initialsClass" class="font-weight-bold text-white">{{ initials }}</span>
      </v-avatar>

      <!-- Upload overlay -->
      <div class="avatar-overlay">
        <v-icon color="white" size="20">mdi-camera</v-icon>
      </div>
    </div>

    <!-- Label -->
    <div v-if="showLabel" class="text-caption text-grey mt-2 text-center">
      {{ uploading ? 'در حال آپلود...' : 'برای تغییر عکس کلیک کنید' }}
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      style="display:none"
      @change="handleFile"
    />

    <!-- Progress -->
    <v-progress-linear
      v-if="uploading"
      indeterminate
      color="primary"
      rounded
      class="mt-2"
      style="max-width:80px;margin:0 auto"
    />

    <!-- Error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      rounded="lg"
      density="compact"
      class="mt-2"
      :text="error"
    />

    <!-- Success snackbar -->
    <v-snackbar v-model="successSnack" color="success" timeout="2500" location="top">
      <v-icon start>mdi-check-circle</v-icon>
      عکس با موفقیت بارگذاری شد
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  // Current avatar URL (from server)
  modelValue?: string | null
  // Initials fallback (e.g. first letter of name)
  initials?: string
  // Avatar size
  size?: number
  // Avatar color when no image
  color?: string
  // Upload endpoint — e.g. '/upload/avatar/me'
  endpoint: string
  // Auth token
  token?: string
  // Show label below avatar
  showLabel?: boolean
  // Label text override
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'uploaded', user: any): void
}>()

const config      = useRuntimeConfig()
const fileInput   = ref<HTMLInputElement | null>(null)
const uploading   = ref(false)
const error       = ref('')
const successSnack = ref(false)

const currentAvatar = computed(() => props.modelValue)

const avatarSrc = computed(() => {
  if (!currentAvatar.value) return ''
  // If already a full URL, return as-is
  if (currentAvatar.value.startsWith('http')) return currentAvatar.value
  // Otherwise prepend API base
  return `${config.public.apiBase.replace('/api', '')}${currentAvatar.value}`
})

const initialsClass = computed(() => {
  if ((props.size || 80) >= 64) return 'text-h4'
  if ((props.size || 80) >= 48) return 'text-h5'
  return 'text-body-1'
})

const triggerFileInput = () => {
  if (uploading.value) return
  fileInput.value?.click()
}

const handleFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Client-side validation
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'حجم فایل نباید بیش از ۵ مگابایت باشد'
    return
  }

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    error.value = 'فقط تصاویر JPG، PNG و WebP مجاز هستند'
    return
  }

  uploading.value = true
  error.value     = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const apiBase = config.public.apiBase
    const headers: Record<string, string> = {}
    if (props.token) headers['Authorization'] = `Bearer ${props.token}`

    const res = await fetch(`${apiBase}${props.endpoint}`, {
      method:  'POST',
      headers,
      body:    formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'خطا در بارگذاری تصویر')
    }

    const data = await res.json()
    const newUrl = data.avatarUrl || data.avatar || ''
    emit('update:modelValue', newUrl)
    emit('uploaded', data)
    successSnack.value = true
  } catch (e: any) {
    error.value = e.message || 'خطا در بارگذاری تصویر'
  } finally {
    uploading.value = false
    // Reset input so same file can be re-selected
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style scoped>
.avatar-upload-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  display: inline-block;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-img {
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s;
}

.avatar-container:hover .avatar-img {
  transform: scale(1.03);
}
</style>
