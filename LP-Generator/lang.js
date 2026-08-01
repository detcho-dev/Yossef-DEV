// ============================================================
// ===== LANGUAGE MANAGER (مع دعم RTL) =====
// ============================================================

// ===== تغيير اتجاه الصفحة =====
function setDirection(lang) {
  const html = document.getElementById('html-root');
  if (lang === 'ar') {
    html.dir = 'rtl';
    html.lang = 'ar';
    // أضف class للـ RTL عشان نتحكم في التصميم
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    html.dir = 'ltr';
    html.lang = 'en';
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
}

// ===== تغيير اللغة (معدل) =====
window.setLanguage = async function(lang) {
  localStorage.setItem('language', lang);
  await loadLanguage(lang);
  setDirection(lang);
  updateUI();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    }
  });
};

// ===== تهيئة اللغة (معدل) =====
async function initLanguage() {
  const lang = getLanguage();
  await loadLanguage(lang);
  setDirection(lang);
  updateUI();
}
