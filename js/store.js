/**
 * AARNA USA - Dynamic Store & Content Management Engine
 * Handles real-time synchronization between Admin Dashboard and public website.
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    RETAIL: 'aarna_products_retail',
    DEVICES: 'aarna_products_devices',
    INSTITUTIONAL: 'aarna_products_institutional',
    CONTENT: 'aarna_site_content',
    MEDIA: 'aarna_site_media',
    INQUIRIES: 'aarna_contact_inquiries',
    AUTH: 'aarna_admin_session'
  };

  // Default content fallback
  const DEFAULT_CONTENT = {
    company_name: 'AARNA USA Inc.',
    company_tagline: 'Trusted Healthcare Solutions',
    contact_address_line1: '2080 Enterprise Dr NE',
    contact_address_line2: 'Leland, NC 28451',
    contact_email: 'info@aarnaus.com',
    contact_phone: '(866) 906-6239',
    contact_hours: 'Monday through Friday, 8:00 AM – 5:00 PM EST',
    
    // Home Page
    hero_home_title: 'Unleash Healthcare<br>Excellence Today.<br>All In One Place.',
    hero_home_desc: 'AARNA USA serves healthcare institutions, pharmacies, and retail customers with OTC medicines, institutional unit-dose products, medical supplies, and healthcare supplies.',
    hero_subbar_left: 'TRUSTED HEALTHCARE SOLUTIONS',
    hero_subbar_right: 'QUALITY · RELIABILITY · CARE',
    catalog_cta_title: 'Aarna USA Product Catalog',
    catalog_cta_desc: 'Download our comprehensive product guide featuring all 71 retail pharmaceuticals, 10 institutional unit-dose cups, and 23 medical supplies.',
    federal_title: 'Federal Healthcare Opportunities',
    federal_desc: 'AARNA USA is interested in federal healthcare procurement opportunities for OTC unit-dose products, medical supplies, and healthcare supplies. We welcome inquiries from government contractors and procurement teams serving Veterans Affairs (VA) healthcare facilities and Bureau of Prisons healthcare settings.',
    
    // About Us Page
    about_hero_title: 'About AARNA USA',
    about_hero_subtitle: 'Aarna provides healthcare products for Institutional and retail pharmacy customers',
    about_hero_desc: 'AARNA USA supplies OTC medicines, medical supplies, and healthcare supplies to healthcare institutions, pharmacies, and retail customers. Medicines are available in retail packages and institutional unit-dose formats. AARNA USA also offers private-label OTC products for businesses seeking products under their own brand.',
    about_what_title: 'What We Do',
    about_what_desc: 'AARNA USA supplies AARNA-brand OTC medicines, medical supplies, and healthcare supplies, with a primary focus on healthcare institutions. We also serve pharmacies and retail customers. AARNA USA offers private-label OTC products for businesses seeking products under their own brand.',
    
    // Contact Us Page
    contact_eyebrow: 'CONTACT AARNA USA',
    contact_hero_title: 'Let’s discuss<br>your requirements.',
    contact_hero_desc: 'For product information, availability, pricing, and private-label OTC inquiries.',
    contact_next_title: 'What happens next?',
    contact_next_desc: 'Our team reviews your requirements and contacts you to discuss the next steps.'
  };

  const AarnaStore = {
    // ------------------------------------------------------------------------
    // PRODUCTS CRUD
    // ------------------------------------------------------------------------
    getProducts(catalogType) {
      const key = STORAGE_KEYS[catalogType.toUpperCase()] || STORAGE_KEYS.RETAIL;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Error reading products from localStorage:', err);
      }

      // Fallback to static data if not in storage
      if (window.AARNA_DATA && window.AARNA_DATA[catalogType]) {
        return window.AARNA_DATA[catalogType];
      }
      return [];
    },

    saveProducts(catalogType, productsArray) {
      const key = STORAGE_KEYS[catalogType.toUpperCase()];
      if (!key) return false;
      try {
        localStorage.setItem(key, JSON.stringify(productsArray));
        this.notifyChange('products', { catalogType, count: productsArray.length });
        return true;
      } catch (err) {
        console.error('Error saving products:', err);
        return false;
      }
    },

    addProduct(catalogType, product) {
      const list = [...this.getProducts(catalogType)];
      if (!product.id) {
        product.id = `${catalogType.substr(0, 3)}-${Date.now()}`;
      }
      list.unshift(product);
      return this.saveProducts(catalogType, list);
    },

    updateProduct(catalogType, id, updatedData) {
      const list = [...this.getProducts(catalogType)];
      const idx = list.findIndex(item => item.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatedData };
        return this.saveProducts(catalogType, list);
      }
      return false;
    },

    deleteProduct(catalogType, id) {
      const list = [...this.getProducts(catalogType)];
      const filtered = list.filter(item => item.id !== id);
      return this.saveProducts(catalogType, filtered);
    },

    resetCatalog(catalogType) {
      const key = STORAGE_KEYS[catalogType.toUpperCase()];
      if (key) {
        localStorage.removeItem(key);
        this.notifyChange('products', { catalogType });
      }
    },

    // ------------------------------------------------------------------------
    // CONTENT CRUD
    // ------------------------------------------------------------------------
    getContent() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
        if (stored) {
          return { ...DEFAULT_CONTENT, ...JSON.parse(stored) };
        }
      } catch (err) {
        console.warn('Error reading content:', err);
      }
      return { ...DEFAULT_CONTENT };
    },

    saveContent(keyOrObj, maybeValue) {
      try {
        const current = this.getContent();
        let updated = {};
        if (typeof keyOrObj === 'string') {
          updated = { ...current, [keyOrObj]: maybeValue };
        } else if (typeof keyOrObj === 'object' && keyOrObj !== null) {
          updated = { ...current, ...keyOrObj };
        } else {
          updated = { ...current };
        }
        localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(updated));
        this.notifyChange('content', updated);
        this.applyContentToPage();

        // Background sync to Firebase if available
        if (window.AarnaFirebase && typeof window.AarnaFirebase.saveCmsContent === 'function') {
          window.AarnaFirebase.saveCmsContent(updated);
        }

        return true;
      } catch (err) {
        console.error('Error saving content:', err);
        return false;
      }
    },

    saveAllContent(contentObj) {
      return this.saveContent(contentObj);
    },

    resetContent() {
      localStorage.removeItem(STORAGE_KEYS.CONTENT);
      this.applyContentToPage();
      this.notifyChange('content', DEFAULT_CONTENT);
    },

    // ------------------------------------------------------------------------
    // MEDIA ASSETS (Base64 / DataURL Storage)
    // ------------------------------------------------------------------------
    getMedia(slotKey) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MEDIA);
        if (stored) {
          const map = JSON.parse(stored);
          return map[slotKey] || null;
        }
      } catch (err) {
        console.warn('Error reading media:', err);
      }
      return null;
    },

    getAllMedia() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MEDIA);
        if (stored) return JSON.parse(stored);
      } catch (err) {
        console.warn('Error reading media:', err);
      }
      return {};
    },

    saveMedia(slotKey, dataUrl) {
      try {
        const all = this.getAllMedia();
        all[slotKey] = dataUrl;
        localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(all));
        this.notifyChange('media', { slotKey });
        this.applyMediaToPage();
        return true;
      } catch (err) {
        console.error('Error saving media:', err);
        return false;
      }
    },

    deleteMedia(slotKey) {
      try {
        const all = this.getAllMedia();
        delete all[slotKey];
        localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(all));
        this.notifyChange('media', { slotKey });
        this.applyMediaToPage();
        return true;
      } catch (err) {
        console.error('Error deleting media:', err);
        return false;
      }
    },

    // ------------------------------------------------------------------------
    // INQUIRIES & LEADS
    // ------------------------------------------------------------------------
    getInquiries() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Error reading inquiries:', err);
      }
      return [];
    },

    addInquiry(inquiry) {
      const list = this.getInquiries();
      const newInquiry = {
        id: 'inq-' + Date.now(),
        date: new Date().toISOString(),
        status: 'unread', // 'unread' | 'read' | 'contacted'
        ...inquiry
      };
      list.unshift(newInquiry);
      try {
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(list));
        this.notifyChange('inquiries', newInquiry);
        return true;
      } catch (err) {
        console.error('Error saving inquiry:', err);
        return false;
      }
    },

    updateInquiryStatus(id, newStatus) {
      const list = this.getInquiries();
      const item = list.find(it => it.id === id);
      if (item) {
        item.status = newStatus;
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(list));
        this.notifyChange('inquiries', { id, newStatus });
        return true;
      }
      return false;
    },

    deleteInquiry(id) {
      const list = this.getInquiries().filter(it => it.id !== id);
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(list));
      this.notifyChange('inquiries', { deletedId: id });
      return true;
    },

    clearAllInquiries() {
      localStorage.removeItem(STORAGE_KEYS.INQUIRIES);
      this.notifyChange('inquiries', { cleared: true });
    },

    // ------------------------------------------------------------------------
    // REAL-TIME PAGE BINDINGS
    // Scans all elements with `data-cms-key` and `data-cms-media`
    // ------------------------------------------------------------------------
    applyContentToPage() {
      const content = this.getContent();
      document.querySelectorAll('[data-cms-key]').forEach(el => {
        const key = el.getAttribute('data-cms-key');
        if (content[key] !== undefined) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = content[key];
          } else {
            el.innerHTML = content[key];
            if (el.tagName === 'A') {
              if (key === 'contact_email') {
                el.setAttribute('href', `mailto:${content[key]}`);
              } else if (key === 'contact_phone') {
                const cleaned = String(content[key]).replace(/[^0-9]/g, '');
                el.setAttribute('href', `tel:${cleaned}`);
              }
            }
          }
        }
      });
    },

    applyMediaToPage() {
      const media = this.getAllMedia();
      document.querySelectorAll('[data-cms-media]').forEach(el => {
        const slot = el.getAttribute('data-cms-media');
        if (media[slot]) {
          if (el.tagName === 'IMG') {
            el.src = media[slot];
          } else {
            el.style.backgroundImage = `url('${media[slot]}')`;
          }
        }
      });
    },

    // ------------------------------------------------------------------------
    // BACKUP & RESTORE
    // ------------------------------------------------------------------------
    exportFullBackup() {
      return JSON.stringify({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        retail: this.getProducts('retail'),
        devices: this.getProducts('devices'),
        institutional: this.getProducts('institutional'),
        content: this.getContent(),
        media: this.getAllMedia(),
        inquiries: this.getInquiries()
      }, null, 2);
    },

    importFullBackup(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (data.retail) this.saveProducts('retail', data.retail);
        if (data.devices) this.saveProducts('devices', data.devices);
        if (data.institutional) this.saveProducts('institutional', data.institutional);
        if (data.content) localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(data.content));
        if (data.media) localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(data.media));
        if (data.inquiries) localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(data.inquiries));

        this.applyContentToPage();
        this.applyMediaToPage();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    resetAllToDefaults() {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.AUTH) {
          localStorage.removeItem(key);
        }
      });
      this.applyContentToPage();
      this.applyMediaToPage();
    },

    // ------------------------------------------------------------------------
    // AUTHENTICATION STATE
    // ------------------------------------------------------------------------
    isAuthenticated() {
      return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'active';
    },

    setAuthenticated(val) {
      if (val) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH, 'active');
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    },

    // Internal notification dispatcher
    notifyChange(type, detail) {
      window.dispatchEvent(new CustomEvent('aarna:datachange', {
        detail: { type, detail }
      }));
    }
  };

  // Expose globally
  window.AarnaStore = AarnaStore;

  // Auto-apply on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      AarnaStore.applyContentToPage();
      AarnaStore.applyMediaToPage();
    });
  } else {
    AarnaStore.applyContentToPage();
    AarnaStore.applyMediaToPage();
  }

  // Cross-tab synchronization (updates live site instantly when saved in admin)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.CONTENT) {
      AarnaStore.applyContentToPage();
    } else if (e.key === STORAGE_KEYS.MEDIA) {
      AarnaStore.applyMediaToPage();
    }
  });

})(window);
