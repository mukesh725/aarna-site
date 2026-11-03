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

  // Default content fallback covering all sections of the site
  const DEFAULT_CONTENT = {
    // Global Brand & Contact Info
    company_name: 'AARNA USA Inc.',
    company_tagline: 'Quality · Reliability · Care',
    footer_desc: 'AARNA supplies OTC pharmaceuticals, Unit Dose products and selected medical supplies.',
    contact_phone: '(866) 906-6239',
    contact_email: 'info@aarnaus.com',
    contact_address_line1: '2080 Enterprise Dr NE',
    contact_address_line2: 'Leland, NC 28451',
    contact_hours: 'Monday through Friday, 8:00 AM – 5:00 PM EST',

    // Home Page - Section 1: Hero Horizon
    hero_home_title: 'Unleash Healthcare<br>Excellence Today.<br>All In One Place.',
    hero_home_desc: 'AARNA USA serves healthcare institutions, pharmacies, and retail customers with OTC medicines, institutional unit-dose products, medical supplies, and healthcare supplies.',
    hero_catalog_btn: 'Download our catalog',
    hero_subbar_left: 'TRUSTED HEALTHCARE SOLUTIONS',
    hero_subbar_right: 'QUALITY · RELIABILITY · CARE',
    hero_proof_line1: 'Supplying 500+ Healthcare Institutions.',
    hero_proof_line2: 'Get the real results.',

    // Home Page - Section 2: Product Showcase (3 Divisions)
    showcase_heading: 'Find the product you need',
    card_inst_title: 'Institutional Products',
    card_inst_desc: 'Pre-filled unit-dose oral liquid cups and institutional medications engineered for hospitals and care facilities.',
    card_inst_pill1: 'Unit-Dose Liquids',
    card_inst_pill2: 'Hospital Care',
    card_retail_title: 'Retail Products',
    card_retail_desc: 'Comprehensive line of high-efficacy OTC pharmaceuticals across pain relief, allergy, digestive, and family care.',
    card_retail_pill1: 'OTC Formulas',
    card_retail_pill2: 'Retail & Pharmacy',
    card_devices_title: 'Medical Supplies',
    card_devices_desc: 'Hospital-grade medical supplies, aerosol spacer chambers, sterile insulin pen needles, and lancets.',
    card_devices_pill1: 'Sterile Supplies',
    card_devices_pill2: 'Clinical DME',

    // Home Page - Section 3: Private Label Solutions
    pl_eyebrow: 'Private label',
    pl_title: '<span class="pl-title-blue">Your brand.</span><br><span class="pl-title-dark">Our OTC medicines.</span>',
    pl_desc: 'Oral liquids, tablets, capsules, and topical creams, packaged under your name.',
    pl_btn_text: 'Start your brand',
    pl_footnote: 'For pharmacies, retailers, and distributors building their own product line.',

    // Home Page - Section 4: Who We Serve
    serve_eyebrow: 'WHO WE SERVE',
    serve_title: 'Here for the people<br>behind everyday care.',
    serve_item1_title: 'Hospitals & healthcare institutions',
    serve_item1_sub: 'Including long-term care providers',
    serve_item2_title: 'Pharmacies',
    serve_item3_title: 'Retail businesses & customers',
    serve_item4_title: 'Businesses seeking private-label OTC products',
    serve_item5_title: 'Distributors and Group Purchasing Organizations (GPOs)',

    // Home Page - Section 5: Federal Healthcare Opportunities
    federal_title: 'Federal Healthcare Opportunities',
    federal_desc: 'AARNA USA is interested in federal healthcare procurement opportunities for OTC unit-dose products, medical supplies, and healthcare supplies. We welcome inquiries from government contractors and procurement teams serving Veterans Affairs (VA) healthcare facilities and Bureau of Prisons healthcare settings.',
    federal_btn_text: 'Discuss a Federal<br>Procurement Opportunity',

    // Home Page - Section 6: Our Partners
    partners_badge: 'OUR PARTNERS',
    partners_title: 'Built on <span class="partners-serif-blue">trusted partnerships.</span>',
    partners_subtitle: 'Working alongside established healthcare organizations to support quality, reliability, and consistent delivery.',

    // Home Page - Section 7: Catalog Callout Banner
    catalog_cta_title: 'Need product details?',
    catalog_cta_desc: 'Explore the AARNA catalog or discuss your requirements.',
    catalog_cta_btn: 'View Catalog',

    // About Us Page
    about_hero_title: 'About AARNA USA',
    about_hero_desc: 'AARNA USA supplies OTC medicines, medical supplies, and healthcare supplies to healthcare institutions, pharmacies, and retail customers. Medicines are available in retail packages and institutional unit-dose formats. AARNA USA also offers private-label OTC products for businesses seeking products under their own brand.',
    about_what_title: 'What We Do',
    about_what_desc: 'AARNA USA supplies AARNA-brand OTC medicines, medical supplies, and healthcare supplies, with a primary focus on healthcare institutions. We also serve pharmacies and retail customers. AARNA USA offers private-label OTC products for businesses seeking products under their own brand.',

    // Contact Us Page
    contact_eyebrow: 'CONTACT AARNA USA',
    contact_hero_title: 'Let’s discuss<br>your requirements.',
    contact_hero_desc: 'For product information, availability, pricing, and private-label OTC inquiries.',
    contact_next_title: 'What happens next?',
    contact_next_desc: 'Our team reviews your requirements and contacts you to discuss the next steps.',

    // Dedicated Catalog Pages
    inst_page_title: 'Institutional Products',
    inst_page_desc: 'OTC medicines in institutional unit-dose formats for healthcare providers.',
    retail_page_title: 'Retail Products',
    retail_page_desc: 'High efficacy OTC pharmaceuticals across pain relief, allergy, digestive, and family care.',
    devices_page_title: 'Medical Supplies & Devices',
    devices_page_desc: 'Clinical equipment, aerosol spacers, sterile insulin pen needles, and surgical supplies.'
  };

  // Default Media Assets Fallback covering all sections
  const DEFAULT_MEDIA = {
    logo_main: 'assets/logos/aarna-logo-clean.png',
    admin_hero: 'assets/images/admin-login-hero.jpg',
    hero_bg: 'assets/images/hero-tablets-bg.jpg',
    card_institutional: 'assets/images/card-institutional.png',
    card_retail: 'assets/images/card-retail.png',
    card_devices: 'assets/images/card-medical-devices.png',
    private_label_img: 'assets/images/private-label-blue-card.png',
    partner_cencora: 'assets/logos/logo-cencora-ref.png',
    partner_cardinal: 'assets/logos/logo-cardinal-ref.png',
    partner_mckesson: 'assets/logos/logo-mckesson-ref.png',
    partner_medline: 'assets/logos/logo-medline-ref.png',
    about_pharmacy: 'assets/images/about-pharmacy-counter.png',
    inst_hero_img: 'assets/images/cups-liquid-dosage.png',
    retail_hero_img: 'assets/images/bottles-solid-dosage.png',
    devices_hero_img: 'assets/images/card-medical-devices.png'
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
    getDefaultMedia(slotKey) {
      return slotKey ? DEFAULT_MEDIA[slotKey] : DEFAULT_MEDIA;
    },

    getCustomMedia() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MEDIA);
        if (stored) return JSON.parse(stored);
      } catch (err) {
        console.warn('Error reading custom media:', err);
      }
      return {};
    },

    getMedia(slotKey) {
      const custom = this.getCustomMedia();
      if (custom[slotKey]) return custom[slotKey];
      return DEFAULT_MEDIA[slotKey] || null;
    },

    getAllMedia() {
      const custom = this.getCustomMedia();
      return { ...DEFAULT_MEDIA, ...custom };
    },

    saveMedia(slotKey, dataUrl) {
      try {
        const custom = this.getCustomMedia();
        custom[slotKey] = dataUrl;
        localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(custom));
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
        const custom = this.getCustomMedia();
        delete custom[slotKey];
        localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(custom));
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
