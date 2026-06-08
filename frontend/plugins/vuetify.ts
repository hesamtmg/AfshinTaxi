import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#F5A623',
            secondary: '#1A1A2E',
            accent: '#E94560',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            info: '#2196F3',
            background: '#F8F9FA',
            surface: '#FFFFFF',
          },
        },
        dark: {
          colors: {
            primary: '#F5A623',
            secondary: '#E94560',
            background: '#0F0F1A',
            surface: '#1A1A2E',
          },
        },
      },
    },
    defaults: {
      VBtn: {
        rounded: 'lg',
        fontWeight: '600',
      },
      VCard: {
        rounded: 'xl',
        elevation: 0,
      },
      VTextField: {
        rounded: 'lg',
        variant: 'outlined',
      },
    },
  })
  app.vueApp.use(vuetify)
})
