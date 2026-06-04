import { createI18n } from "vue-i18n";

import en from "../locales/en.json";
import th from "../locales/th.json";
import ja from "../locales/ja.json";

const savedLocale = localStorage.getItem("lang") || "en";

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: "en",
  messages: {
    en,
    th,
    ja,
  },
});

export const setLocale = (value) => {
  const nextLocale = i18n.global.messages[value] ? value : "en";
  i18n.global.locale.value = nextLocale;
  localStorage.setItem("lang", nextLocale);
  document.documentElement.lang = nextLocale;
};

export const supportedLocales = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "th", flag: "🇹🇭", label: "ไทย" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
];

export default i18n;