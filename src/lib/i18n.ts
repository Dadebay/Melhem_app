import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import storage from './storage';
import tm from '../locales/tm.json';
import ru from '../locales/ru.json';

i18n
  .use(initReactI18next)
  .use({
    async: true,
    init: Function.prototype,
    type: 'languageDetector',
    detect: async (callback: (language: string) => void) => {
      const lng = storage.mmkv.getString('lng');
      callback(lng ?? 'tm');
    },
    cacheUserLanguage: async (language: string) => {
      storage.mmkv.set('lng', language);
    },
  })
  .init({
    resources: {
      tm: {translation: tm},
      ru: {translation: ru},
    },
    fallbackLng: 'tm',
    react: {
      useSuspense: false,
    },
  });

export default i18n;
