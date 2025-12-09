import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import jp from './locales/jp.json';
import vn from './locales/vn.json';

// Lấy ngôn ngữ đã lưu hoặc mặc định là 'jp'
const savedLanguage = localStorage.getItem('language') || 'jp';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      jp: { translation: jp },
      vn: { translation: vn }
    },
    lng: savedLanguage,
    fallbackLng: 'jp',
    interpolation: {
      escapeValue: false
    }
  });

// Hàm thay đổi ngôn ngữ
export const changeLanguage = (lang) => {
  localStorage.setItem('language', lang);
  i18n.changeLanguage(lang);
};

// Hàm lấy ngôn ngữ hiện tại
export const getCurrentLanguage = () => {
  return i18n.language || localStorage.getItem('language') || 'jp';
};

export default i18n;
