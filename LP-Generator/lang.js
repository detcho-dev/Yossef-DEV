// ============================================================
// ===== LANGUAGE MANAGER =====
// ============================================================
const translations = {};

// ===== تحميل ملف الترجمة =====
async function loadLanguage(lang = 'en') {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) throw new Error('Language file not found');
    translations[lang] = await response.json();
    return translations[lang];
  } catch (error) {
    console.error('Error loading language:', error);
    return {};
  }
}

// ===== الحصول على الترجمة =====
function t(key, lang = 'en') {
  const keys = key.split('.');
  let value = translations[lang];
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  return value;
}

// ===== تغيير اللغة =====
async function setLanguage(lang) {
  localStorage.setItem('language', lang);
  await loadLanguage(lang);
  updateUI();
}

// ===== الحصول على اللغة الحالية =====
function getLanguage() {
  return localStorage.getItem('language') || 'en';
}

// ===== تحديث الواجهة =====
function updateUI() {
  const lang = getLanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key, lang);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key, lang);
  });
}

// ===== تهيئة اللغة =====
async function initLanguage() {
  const lang = getLanguage();
  await loadLanguage(lang);
  updateUI();
}
