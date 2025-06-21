// Cookie Banner Management
class CookieManager {
    constructor() {
        this.cookieBanner = document.getElementById('cookie-banner');
        this.cookieModal = document.getElementById('cookie-modal');
        this.cookiePreferences = {
            essential: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        this.init();
    }
    
    init() {
        // Show cookie banner after a short delay
        setTimeout(() => {
            this.showCookieBanner();
        }, 1000);
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Cookie banner buttons
        document.getElementById('accept-cookies').addEventListener('click', () => {
            this.acceptAllCookies();
        });
        
        document.getElementById('reject-cookies').addEventListener('click', () => {
            this.rejectAllCookies();
        });
        
        document.getElementById('manage-cookies').addEventListener('click', () => {
            this.showCookieModal();
        });
        
        // Modal buttons
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideCookieModal();
        });
        
        document.getElementById('save-preferences').addEventListener('click', () => {
            this.saveCookiePreferences();
        });
        
        document.getElementById('accept-all-modal').addEventListener('click', () => {
            this.acceptAllCookies();
        });
        
        document.getElementById('reject-all-modal').addEventListener('click', () => {
            this.rejectAllCookies();
        });
        
        // Close modal when clicking outside
        this.cookieModal.addEventListener('click', (e) => {
            if (e.target === this.cookieModal) {
                this.hideCookieModal();
            }
        });
        
        // Handle checkbox changes
        document.getElementById('analytics-cookies').addEventListener('change', (e) => {
            this.cookiePreferences.analytics = e.target.checked;
        });
        
        document.getElementById('marketing-cookies').addEventListener('change', (e) => {
            this.cookiePreferences.marketing = e.target.checked;
        });
        
        document.getElementById('preference-cookies').addEventListener('change', (e) => {
            this.cookiePreferences.preferences = e.target.checked;
        });
    }
    
    showCookieBanner() {
        if (!this.hasUserConsent()) {
            this.cookieBanner.classList.add('show');
        }
    }
    
    hideCookieBanner() {
        this.cookieBanner.classList.remove('show');
    }
    
    showCookieModal() {
        this.cookieModal.classList.add('show');
        this.hideCookieBanner();
    }
    
    hideCookieModal() {
        this.cookieModal.classList.remove('show');
    }
    
    acceptAllCookies() {
        this.cookiePreferences = {
            essential: true,
            analytics: true,
            marketing: true,
            preferences: true
        };
        
        this.saveUserConsent();
        this.hideCookieBanner();
        this.hideCookieModal();
        this.showConsentMessage('All cookies accepted');
    }
    
    rejectAllCookies() {
        this.cookiePreferences = {
            essential: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        this.saveUserConsent();
        this.hideCookieBanner();
        this.hideCookieModal();
        this.showConsentMessage('Non-essential cookies rejected');
    }
    
    saveCookiePreferences() {
        this.saveUserConsent();
        this.hideCookieModal();
        this.showConsentMessage('Cookie preferences saved');
    }
    
    saveUserConsent() {
        const consentData = {
            timestamp: new Date().toISOString(),
            preferences: this.cookiePreferences
        };
        
        localStorage.setItem('shopSmartCookieConsent', JSON.stringify(consentData));
    }
    
    hasUserConsent() {
        return localStorage.getItem('shopSmartCookieConsent') !== null;
    }
    
    showConsentMessage(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Product Interaction
class ProductManager {
    constructor() {
        this.cart = [];
        this.init();
    }
    
    init() {
        this.bindProductEvents();
    }
    
    bindProductEvents() {
        const addToCartButtons = document.querySelectorAll('.product-card .btn-secondary');
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('.price').textContent;
                
                this.addToCart(productName, productPrice);
            });
        });
    }
    
    addToCart(productName, productPrice) {
        this.cart.push({ name: productName, price: productPrice });
        this.updateCartDisplay();
        this.showAddToCartMessage(productName);
    }
    
    updateCartDisplay() {
        const cartButton = document.querySelector('.nav-actions .btn-primary');
        cartButton.textContent = `Cart (${this.cart.length})`;
    }
    
    showAddToCartMessage(productName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;
        notification.textContent = `${productName} added to cart!`;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
}

// Smooth scrolling for navigation links
class NavigationManager {
    constructor() {
        this.init();
    }
    
    init() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                if (href === '#') {
                    // Scroll to top
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Initialize all managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CookieManager();
    new ProductManager();
    new NavigationManager();
    
    // Add some interactive animations
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add loading animation
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        heroContent.style.transition = 'all 0.6s ease-out';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }, 200);
}); 