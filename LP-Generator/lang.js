// ============================================================
// ===== LANGUAGE MANAGER (مع دعم RTL) =====
// ============================================================
const translations = {};

// ===== تحميل ملف الترجمة =====
window.loadLanguage = async function(lang = 'en') {
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
    if (lang !== 'en') {
      console.log('🔄 Falling back to English');
      return window.loadLanguage('en');
    }
    return {};
  }
};

// ===== الحصول على الترجمة =====
window.t = function(key, lang = 'en') {
  const keys = key.split('.');
  let value = translations[lang];
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      if (lang !== 'en') {
        return window.t(key, 'en');
      }
      return key;
    }
  }
  return value;
};

// ===== تغيير اتجاه الصفحة =====
function setDirection(lang) {
  const html = document.getElementById('html-root');
  if (!html) return;
  if (lang === 'ar') {
    html.dir = 'rtl';
    html.lang = 'ar';
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    html.dir = 'ltr';
    html.lang = 'en';
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
}

// ===== تغيير اللغة =====
window.setLanguage = async function(lang) {
  localStorage.setItem('language', lang);
  await window.loadLanguage(lang);
  setDirection(lang);
  window.updateUI();
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
window.updateUI = function() {
  const lang = window.getLanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = window.t(key, lang);
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = window.t(key, lang);
    if (translation && translation !== key) {
      el.placeholder = translation;
    }
  });
};

// ===== تهيئة اللغة =====
async function initLanguage() {
  const lang = window.getLanguage();
  await window.loadLanguage(lang);
  setDirection(lang);
  window.updateUI();
}

// ===== تحميل اللغة عند بدء التشغيل =====
initLanguage();
