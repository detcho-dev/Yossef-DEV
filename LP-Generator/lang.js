// ============================================================
// ===== lang.js =====
// ============================================================
const translations = {};

// ===== تحميل ملف الترجمة =====
async function loadLanguage(lang = 'en') {
  try {
    const response = await fetch(`./locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    translations[lang] = await response.json();
    console.log(`✅ Loaded language: ${lang}`);
    return translations[lang];
  } catch (error) {
    console.error('Error loading language:', error);
    // Load English as fallback
    if (lang !== 'en') {
      console.log('🔄 Falling back to English');
      return loadLanguage('en');
    }
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
      // Try fallback to English
      if (lang !== 'en') {
        return t(key, 'en');
      }
      return key;
    }
  }
  return value;
}

// ===== تغيير اللغة =====
window.setLanguage = async function(lang) {
  localStorage.setItem('language', lang);
  await loadLanguage(lang);
  updateUI();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    }
  });
};

// ===== الحصول على اللغة الحالية =====
window.getLanguage = function() {
  return localStorage.getItem('language') || 'en';
};

// ===== تحديث الواجهة =====
function updateUI() {
  const lang = getLanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key, lang);
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key, lang);
    if (translation && translation !== key) {
      el.placeholder = translation;
    }
  });
}

// ===== تهيئة اللغة =====
async function initLanguage() {
  const lang = getLanguage();
  await loadLanguage(lang);
  updateUI();
}

// ===== تحميل اللغة عند بدء التشغيل =====
initLanguage();
