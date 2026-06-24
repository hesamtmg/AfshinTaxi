import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,

  build: {
    transpile: ['vuetify', 'form-data'],
  },

  buildModules: [
    '@alireza-ab/vue-persian-datepicker/nuxt'
  ],
  css: [
    '~/assets/css/iranyekan/fontiran.css',
  ],
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins?.push(vuetify({ autoImport: true }))
      })
    },
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api',

      neshanWebKey: process.env.NUXT_PUBLIC_NESHAN_WEB_KEY || '',  // Map display key
      neshanApiKey: process.env.NUXT_PUBLIC_NESHAN_API_KEY || '',  // Routing + reverse geocode key
    },
  },

  nitro: {
    prerender: {
      crawlLinks: false,
    },
  },

  app: {
    head: {
      title: 'AfshinTaxi',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
       
      ],
    },
  },
})
