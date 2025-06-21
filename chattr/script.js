// Dark Pattern Cookie Banner Logic
class CookieManager {
  constructor() {
    this.cookieBanner = document.getElementById('cookie-banner');
    this.cookieModal = document.getElementById('cookie-modal');
    this.acceptBtn = document.getElementById('accept-cookies');
    this.settingsBtn = document.getElementById('settings-cookies');
    this.saveBtn = document.getElementById('save-preferences');
    this.rejectBtn = document.getElementById('reject-all');
    this.closeBtn = document.getElementById('close-modal');
    this.consentKey = 'chattrCookieConsent';
    this.init();
  }
  init() {
    setTimeout(() => {
      if (!this.hasConsent()) {
        this.showBanner();
      }
    }, 1200);
    this.acceptBtn.addEventListener('click', () => this.acceptAll());
    this.settingsBtn.addEventListener('click', () => this.showModal());
    this.saveBtn.addEventListener('click', () => this.savePreferences());
    this.rejectBtn.addEventListener('click', () => this.rejectAll());
    this.closeBtn.addEventListener('click', () => this.hideModal());
    this.cookieModal.addEventListener('click', (e) => {
      if (e.target === this.cookieModal) this.hideModal();
    });
  }
  showBanner() {
    this.cookieBanner.style.transform = 'translateY(0)';
  }
  hideBanner() {
    this.cookieBanner.style.transform = 'translateY(120%)';
  }
  showModal() {
    this.cookieModal.classList.add('show');
    this.hideBanner();
  }
  hideModal() {
    this.cookieModal.classList.remove('show');
    setTimeout(() => this.showBanner(), 300);
  }
  acceptAll() {
    localStorage.setItem(this.consentKey, JSON.stringify({all:true, ts:Date.now()}));
    this.hideBanner();
    this.hideModal();
    this.showMsg('All cookies accepted');
  }
  savePreferences() {
    localStorage.setItem(this.consentKey, JSON.stringify({all:false, ts:Date.now()}));
    this.hideModal();
    this.showMsg('Preferences saved');
  }
  rejectAll() {
    localStorage.setItem(this.consentKey, JSON.stringify({all:false, reject:true, ts:Date.now()}));
    this.hideModal();
    this.showMsg('Non-essential cookies rejected');
  }
  hasConsent() {
    return !!localStorage.getItem(this.consentKey);
  }
  showMsg(msg) {
    const n = document.createElement('div');
    n.style.cssText = 'position:fixed;top:20px;right:20px;background:#3b82f6;color:#fff;padding:1rem 1.5rem;border-radius:8px;z-index:3000;font-weight:600;box-shadow:0 4px 16px rgba(59,130,246,0.15);';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(()=>{n.style.opacity='0';setTimeout(()=>n.remove(),400);},2000);
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  new CookieManager();
}); 