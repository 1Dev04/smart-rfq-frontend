import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import 'primeicons/primeicons.css';
import './style.css';
import App from './App.vue';
import router from './router/router.js';
import i18n from './i18n';
import ToastService from 'primevue/toastservice'

const SmartRFQPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eaf0fb',
      100: '#c9d9f4',
      200: '#93b4e8',
      300: '#5f8fe0',
      400: '#2563c4',
      500: '#1a3d9e',
      600: '#16367d',
      700: '#112b63',
      800: '#0b1f45',
      900: '#06122b'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f4f7ff',
          100: '#e8eef9',
          200: '#d8dbe9',
          300: '#b0b5cc',
          400: '#6b7196',
          500: '#3c4157',
          600: '#1c1f2b',
          700: '#0f1117',
          800: '#08174a',
          900: '#050a18'
        },
        textColor: '#1a2540',
        primaryColor: '#1a3d9e',
        primaryInverseColor: '#ffffff'
      },
      dark: {
        surface: {
          0: '#0f1117',
          50: '#1c1f2b',
          100: '#1c1f2b',
          200: '#3c4157',
          300: '#6b7196',
          400: '#b0b5cc',
          500: '#d8dbe9',
          600: '#e8eef9',
          700: '#f4f7ff',
          800: '#ffffff',
          900: '#ffffff'
        },
        textColor: '#e8f6ff',
        primaryColor: '#38a3f5',
        primaryInverseColor: '#08174a'
      }
    }
  }
});

const app = createApp(App);
app.use(createPinia());
app.use(ToastService);
app.use(router);
app.use(i18n);
app.use(PrimeVue, {
  theme: {
    preset: SmartRFQPreset,
    options: {
      darkModeSelector: '[data-theme="dark"]'
    }
  }
});

app.mount('#app');


const loader = document.getElementById('app-loading');
if (loader) {
  requestAnimationFrame(() => {
    loader.classList.add('fade-out');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  });
}