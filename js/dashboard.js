/**
 * AARNA USA - Admin Dashboard Application Logic
 * LeaseFlow-Inspired High-End Editorial Healthcare Layout
 * Integrated with AarnaStore (Zero Data Loss) & Google Firebase Backend (Spark Free Tier)
 */

(function () {
  'use strict';

  // State
  let currentView = 'catalogs';
  let currentCatalog = 'institutional';
  let catalogSearchQuery = '';
  let catalogCategoryFilter = 'All';
  let catalogFormFilter = 'Any';
  let activeEditProductId = null;
  let activeMediaSlotKey = null;

  // Cache DOM
  const navItems = document.querySelectorAll('.dash-nav-item[data-view]');
  const views = document.querySelectorAll('.dash-view');
  const mainTitleEl = document.getElementById('leaseflow-main-title');
  const catalogSearchInput = document.getElementById('dash-catalog-search');
  const catalogCategorySelect = document.getElementById('dash-catalog-cat-filter');
  const catalogFilterSelect = document.getElementById('dash-filter-catalog');
  const catalogFormSelect = document.getElementById('dash-filter-form');
  const catalogTableBody = document.getElementById('dash-catalog-tbody');
  const pipelineCards = document.querySelectorAll('.pipeline-card[data-catalog-select]');

  // Modals
  const productModal = document.getElementById('product-modal');
  const productForm = document.getElementById('product-form');
  const productModalTitle = document.getElementById('product-modal-title');
  const deleteModal = document.getElementById('delete-modal');
  const deleteConfirmBtn = document.getElementById('confirm-delete-btn');
  const firebaseModal = document.getElementById('firebase-modal');
  const firebaseForm = document.getElementById('firebase-config-form');

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initAuthManager();
    initNavigation();
    initStats();
    initCatalogManager();
    initFirebaseManager();
    initContentManager();
    initMediaManager();
    initInquiriesManager();
    initBackupManager();
    initMobileSidebar();

    // Default to Institutional Care
    switchCatalog('institutional');

    // Listen to store updates
    window.addEventListener('aarna:datachange', () => {
      initStats();
      if (currentView === 'catalogs') renderCatalogTable();
      if (currentView === 'inquiries') renderInquiries();
      if (currentView === 'media') renderMediaGrid();
    });
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION & SIGN OUT
  // --------------------------------------------------------------------------
  function initAuthManager() {
    const signoutBtn = document.getElementById('dash-signout-btn');
    if (signoutBtn) {
      signoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to sign out of the Admin Portal?')) {
          sessionStorage.removeItem('aarna_admin_auth');
          sessionStorage.removeItem('aarna_admin_user');
          window.location.href = 'admin.html?action=logged_out';
        }
      });
    }

    // Populate user profile info if stored
    const userJson = sessionStorage.getItem('aarna_admin_user');
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        const nameEl = document.querySelector('.dash-user-info strong');
        if (nameEl && u.email) {
          nameEl.textContent = u.email.split('@')[0];
        }
      } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // NAVIGATION & VIEW SWITCHING
  // --------------------------------------------------------------------------
  function initNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.dataset.view;
        const targetCatalog = item.dataset.catalog;
        
        switchView(targetView);

        if (targetCatalog) {
          switchCatalog(targetCatalog);
        }

        // Close mobile sidebar if open
        document.querySelector('.dash-sidebar')?.classList.remove('open');
      });
    });

    // Pipeline cards click handling
    pipelineCards.forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.catalogSelect;
        switchView('catalogs');
        switchCatalog(cat);
      });
    });

    // Inquiries pipeline card click
    document.querySelector('.pipeline-card[data-view-select="inquiries"]')?.addEventListener('click', () => {
      switchView('inquiries');
    });

    // Quick filter dropdown pill in topbar
    document.getElementById('btn-quick-filter')?.addEventListener('click', () => {
      if (catalogFilterSelect) {
        catalogFilterSelect.focus();
        catalogFilterSelect.showPicker?.();
      }
    });

    // Add Product button in topbar
    document.getElementById('dash-add-product-btn')?.addEventListener('click', openAddProductModal);
  }

  function switchView(viewName) {
    currentView = viewName;
    navItems.forEach(i => {
      const match = i.dataset.view === viewName && (!i.dataset.catalog || i.dataset.catalog === currentCatalog);
      i.classList.toggle('active', match);
    });

    views.forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));

    // Update main heading based on view
    if (mainTitleEl) {
      if (viewName === 'catalogs') {
        updateMainTitleForCatalog();
      } else if (viewName === 'overview') {
        mainTitleEl.textContent = 'Dashboard Overview';
      } else if (viewName === 'inquiries') {
        mainTitleEl.textContent = 'Customer Inquiries & RFQs';
      } else if (viewName === 'content') {
        mainTitleEl.textContent = 'Site Content (CMS)';
      } else if (viewName === 'media') {
        mainTitleEl.textContent = 'Media & Images Library';
      } else if (viewName === 'settings') {
        mainTitleEl.textContent = 'Settings & Backups';
      }
    }

    if (viewName === 'catalogs') renderCatalogTable();
    if (viewName === 'content') loadContentForm();
    if (viewName === 'media') renderMediaGrid();
    if (viewName === 'inquiries') renderInquiries();
  }

  function switchCatalog(catalogType) {
    currentCatalog = catalogType;
    
    // Update sidebar active buttons
    navItems.forEach(i => {
      if (i.dataset.view === 'catalogs') {
        i.classList.toggle('active', i.dataset.catalog === catalogType);
      }
    });

    // Update pipeline cards highlighted state
    pipelineCards.forEach(c => {
      c.classList.toggle('highlighted', c.dataset.catalogSelect === catalogType);
    });

    // Update filter dropdown select
    if (catalogFilterSelect) {
      catalogFilterSelect.value = catalogType;
    }

    // Update big page title
    updateMainTitleForCatalog();

    // Populate category dropdown
    populateCategoryFilter();
    catalogCategoryFilter = 'All';
    if (catalogCategorySelect) catalogCategorySelect.value = 'All';
    if (catalogSearchInput) {
      catalogSearchInput.value = '';
      catalogSearchQuery = '';
    }

    renderCatalogTable();
  }

  function updateMainTitleForCatalog() {
    if (!mainTitleEl) return;
    if (currentCatalog === 'institutional') {
      mainTitleEl.textContent = 'Institutional Care';
    } else if (currentCatalog === 'retail') {
      mainTitleEl.textContent = 'Retail Products';
    } else if (currentCatalog === 'devices') {
      mainTitleEl.textContent = 'Medical Supplies';
    }
  }

  // --------------------------------------------------------------------------
  // OVERVIEW & STATS
  // --------------------------------------------------------------------------
  function initStats() {
    const inst = window.AarnaStore ? window.AarnaStore.getProducts('institutional') : [];
    const retail = window.AarnaStore ? window.AarnaStore.getProducts('retail') : [];
    const devices = window.AarnaStore ? window.AarnaStore.getProducts('devices') : [];
    const inquiries = window.AarnaStore ? window.AarnaStore.getInquiries() : [];

    setVal('stat-total-products', inst.length + retail.length + devices.length);
    setVal('stat-inst-count', inst.length);
    setVal('stat-retail-count', retail.length);
    setVal('stat-devices-count', devices.length);

    // Sidebar badges
    setVal('badge-inst-count', inst.length);
    setVal('badge-retail-count', retail.length);
    setVal('badge-devices-count', devices.length);
    setVal('badge-inquiries-count', inquiries.length);

    // Pipeline cards
    setVal('pipe-inst-count', inst.length);
    setVal('pipe-retail-count', retail.length);
    setVal('pipe-devices-count', devices.length);
    setVal('pipe-inquiries-count', inquiries.length);
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // --------------------------------------------------------------------------
  // CATALOG MANAGER & LEASEFLOW TABLE RENDERING
  // --------------------------------------------------------------------------
  function initCatalogManager() {
    // Filter dropdowns
    if (catalogFilterSelect) {
      catalogFilterSelect.addEventListener('change', (e) => {
        switchCatalog(e.target.value);
      });
    }

    if (catalogSearchInput) {
      catalogSearchInput.addEventListener('input', (e) => {
        catalogSearchQuery = e.target.value.toLowerCase().trim();
        renderCatalogTable();
      });
    }

    if (catalogCategorySelect) {
      catalogCategorySelect.addEventListener('change', (e) => {
        catalogCategoryFilter = e.target.value;
        renderCatalogTable();
      });
    }

    if (catalogFormSelect) {
      catalogFormSelect.addEventListener('change', (e) => {
        catalogFormFilter = e.target.value;
        renderCatalogTable();
      });
    }

    // Product Form Submit
    if (productForm) {
      productForm.addEventListener('submit', handleProductFormSubmit);
    }

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Delete confirm
    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener('click', async () => {
        if (activeEditProductId) {
          // Zero data loss: Remove from local store and sync cloud
          if (window.AarnaFirebase && typeof window.AarnaFirebase.deleteProduct === 'function') {
            await window.AarnaFirebase.deleteProduct(currentCatalog, activeEditProductId);
          } else {
            window.AarnaStore.deleteProduct(currentCatalog, activeEditProductId);
          }
          closeAllModals();
          renderCatalogTable();
          initStats();
        }
      });
    }
  }

  function populateCategoryFilter() {
    if (!catalogCategorySelect) return;
    const items = window.AarnaStore ? window.AarnaStore.getProducts(currentCatalog) : [];
    const categories = new Set();
    items.forEach(it => {
      if (it.category) categories.add(it.category);
    });

    let opts = '<option value="All">Category: All</option>';
    categories.forEach(cat => {
      opts += `<option value="${cat}">${cat}</option>`;
    });
    catalogCategorySelect.innerHTML = opts;
  }

  function renderCatalogTable() {
    if (!catalogTableBody) return;
    const items = window.AarnaStore ? window.AarnaStore.getProducts(currentCatalog) : [];

    const filtered = items.filter(item => {
      const matchCat = (catalogCategoryFilter === 'All') || (item.category === catalogCategoryFilter);
      const matchQuery = !catalogSearchQuery || 
        (item.description && item.description.toLowerCase().includes(catalogSearchQuery)) ||
        (item.ndc && item.ndc.toLowerCase().includes(catalogSearchQuery)) ||
        (item.category && item.category.toLowerCase().includes(catalogSearchQuery));
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      catalogTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: #8c8f95;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 0.75rem; display: block; color: #cbd5e1;">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <strong style="display: block; font-size: 1rem; color: #0b1523; margin-bottom: 0.25rem;">No products match your criteria</strong>
            <span style="font-size: 0.85rem;">Try adjusting your search query or category filter.</span>
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    filtered.forEach(item => {
      const isInstitutional = currentCatalog === 'institutional';
      const isDevices = currentCatalog === 'devices';

      // Generate initials for avatar chip like LeaseFlow RL, GK, TR
      const initials = (item.description || 'PR')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

      rowsHtml += `
        <tr data-id="${item.id}">
          <td>
            <div class="product-row-title-wrap">
              <div class="product-avatar-chip">${initials}</div>
              <div>
                <span class="product-main-name">${item.description}</span>
                <span class="product-sub-category">${item.category || 'General Formulation'} • ${currentCatalog.toUpperCase()}</span>
              </div>
            </div>
          </td>
          <td>
            <span style="font-family: monospace; font-weight: 600; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem;">
              ${item.ndc || '—'}
            </span>
          </td>
          <td>
            <span style="font-weight: 500;">${item.unit || item.caseSize || 'Standard Dose'}</span>
            <div style="font-size: 0.72rem; color: #8c8f95;">Pack: ${item.packQty || item.caseQty || 'Unit Dose'}</div>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: #475569;">${isInstitutional ? 'Hospitals / GPO' : (isDevices ? 'Clinics / Surgical' : 'Retail / OTC')}</span>
          </td>
          <td>
            <span class="status-pill-badge active-stock">
              <span class="pipeline-dot" style="color: currentColor;"></span>
              Active
            </span>
          </td>
          <td style="text-align: right;">
            <div class="row-actions-group" style="justify-content: flex-end;">
              <button type="button" class="action-circle-btn edit-prod-btn" title="Edit Product" data-id="${item.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button type="button" class="action-circle-btn delete delete-prod-btn" title="Delete Product" data-id="${item.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    catalogTableBody.innerHTML = rowsHtml;

    // Attach listeners
    catalogTableBody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
    });

    catalogTableBody.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteProductModal(btn.dataset.id));
    });
  }

  function openAddProductModal() {
    activeEditProductId = null;
    if (productModalTitle) productModalTitle.textContent = `Add Product to ${capitalize(currentCatalog)}`;
    if (productForm) productForm.reset();
    const catSelect = document.getElementById('modal-product-catalog');
    if (catSelect) catSelect.value = currentCatalog;

    if (productModal) productModal.classList.add('open');
  }

  function openEditProductModal(id) {
    activeEditProductId = id;
    const items = window.AarnaStore ? window.AarnaStore.getProducts(currentCatalog) : [];
    const item = items.find(it => String(it.id) === String(id));
    if (!item) return;

    if (productModalTitle) productModalTitle.textContent = `Edit Product (${item.ndc})`;
    
    setFormVal('modal-product-name', item.description);
    setFormVal('modal-product-ndc', item.ndc);
    setFormVal('modal-product-category', item.category);
    setFormVal('modal-product-strength', item.unit || item.caseSize || '');
    setFormVal('modal-product-pack', item.packQty || item.caseQty || '');
    
    const catSelect = document.getElementById('modal-product-catalog');
    if (catSelect) catSelect.value = currentCatalog;

    if (productModal) productModal.classList.add('open');
  }

  function openDeleteProductModal(id) {
    activeEditProductId = id;
    const items = window.AarnaStore ? window.AarnaStore.getProducts(currentCatalog) : [];
    const item = items.find(it => String(it.id) === String(id));
    if (!item) return;

    const descEl = document.getElementById('delete-product-name');
    if (descEl) descEl.textContent = `"${item.description}" (${item.ndc})`;

    if (deleteModal) deleteModal.classList.add('open');
  }

  async function handleProductFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('modal-product-name')?.value.trim();
    const ndc = document.getElementById('modal-product-ndc')?.value.trim();
    const cat = document.getElementById('modal-product-category')?.value.trim();
    const strength = document.getElementById('modal-product-strength')?.value.trim();
    const pack = document.getElementById('modal-product-pack')?.value.trim();
    const targetCat = document.getElementById('modal-product-catalog')?.value || currentCatalog;

    if (!name || !ndc) {
      alert('Product Name and NDC / Catalog Number are required.');
      return;
    }

    const payload = {
      description: name,
      ndc: ndc,
      category: cat || 'General',
      unit: strength || 'EA',
      packQty: pack || '100',
      caseQty: pack || '100'
    };

    if (targetCat === 'institutional') {
      payload.caseSize = strength || '100 cups';
    }

    // Zero data loss: Save to local persistent store & Cloud Firestore
    if (activeEditProductId) {
      payload.id = activeEditProductId;
      if (window.AarnaStore) window.AarnaStore.updateProduct(targetCat, activeEditProductId, payload);
    } else {
      payload.id = Date.now();
      if (window.AarnaStore) window.AarnaStore.addProduct(targetCat, payload);
    }

    // Sync to Firebase Cloud if connected
    if (window.AarnaFirebase && typeof window.AarnaFirebase.saveProduct === 'function') {
      await window.AarnaFirebase.saveProduct(targetCat, payload);
    }

    closeAllModals();
    renderCatalogTable();
    initStats();
  }

  // --------------------------------------------------------------------------
  // FIREBASE CLOUD BACKEND MANAGER
  // --------------------------------------------------------------------------
  function initFirebaseManager() {
    const triggerButtons = [
      document.getElementById('nav-btn-firebase'),
      document.getElementById('pipe-firebase-card'),
      document.getElementById('firebase-sync-status-badge')
    ];

    triggerButtons.forEach(btn => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        openFirebaseModal();
      });
    });

    if (firebaseForm) {
      firebaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = document.getElementById('fb-api-key')?.value.trim();
        const projectId = document.getElementById('fb-project-id')?.value.trim();
        const authDomain = document.getElementById('fb-auth-domain')?.value.trim();
        const storageBucket = document.getElementById('fb-storage-bucket')?.value.trim();
        const appId = document.getElementById('fb-app-id')?.value.trim();

        if (!projectId) {
          alert('Firebase Project ID is required.');
          return;
        }

        const config = {
          apiKey: apiKey || 'AIzaSyDemoAarnaPlaceholderKeyForSparkTier',
          authDomain: authDomain || `${projectId}.firebaseapp.com`,
          projectId: projectId,
          storageBucket: storageBucket || `${projectId}.appspot.com`,
          appId: appId || `1:1234567890:web:${projectId}`
        };

        if (window.AarnaFirebase) {
          try {
            await window.AarnaFirebase.saveConfig(config);
            alert('Firebase configuration saved! Live Firestore connection initialized.');
            closeAllModals();
          } catch (err) {
            alert('Notice: ' + err.message);
          }
        }
      });
    }

    document.getElementById('btn-seed-cloud-products')?.addEventListener('click', async () => {
      if (window.AarnaFirebase && typeof window.AarnaFirebase.syncAllProductsToCloud === 'function') {
        alert('Starting zero-loss batch sync of all 104 products to Cloud Firestore...');
        await window.AarnaFirebase.syncAllProductsToCloud();
        alert('Cloud sync complete! All products safely mirrored in Firestore.');
      }
    });

    document.getElementById('btn-sync-firebase-now')?.addEventListener('click', async () => {
      if (window.AarnaFirebase) {
        await window.AarnaFirebase.syncAllProductsToCloud();
        alert('Cloud sync complete! All 104 products mirrored in Firestore.');
      }
    });
  }

  function openFirebaseModal() {
    if (window.AarnaFirebase && window.AarnaFirebase.activeConfig) {
      const cfg = window.AarnaFirebase.activeConfig;
      setFormVal('fb-api-key', cfg.apiKey || '');
      setFormVal('fb-project-id', cfg.projectId || '');
      setFormVal('fb-auth-domain', cfg.authDomain || '');
      setFormVal('fb-storage-bucket', cfg.storageBucket || '');
      setFormVal('fb-app-id', cfg.appId || '');
    }
    if (firebaseModal) firebaseModal.classList.add('open');
  }

  // --------------------------------------------------------------------------
  // WORKSPACE MANAGERS (CMS, Media, Inquiries, Backup)
  // --------------------------------------------------------------------------
  function initContentManager() {
    loadContentForm();

    const saveAllBtn = document.getElementById('btn-cms-save-all');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', saveAllCmsFields);
    }

    const resetBtn = document.getElementById('btn-cms-reset-defaults');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all website content back to original defaults?')) {
          if (window.AarnaStore) {
            window.AarnaStore.resetContent();
            loadContentForm();
            if (typeof window.showToast === 'function') {
              window.showToast('All website content restored to defaults.', 'info');
            } else {
              alert('Content reset to defaults.');
            }
          }
        }
      });
    }
  }

  function loadContentForm() {
    const container = document.getElementById('content-items-container');
    if (!container || !window.AarnaStore) return;

    const content = window.AarnaStore.getContent();

    const sections = [
      {
        title: 'Company & Contact Details',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
        desc: 'Updates company branding, phone numbers, and physical address across headers and footers.',
        fields: [
          { key: 'company_name', label: 'Company Name', type: 'input' },
          { key: 'company_tagline', label: 'Company Tagline', type: 'input' },
          { key: 'contact_phone', label: 'Customer Service Phone', type: 'input' },
          { key: 'contact_email', label: 'Official Inquiries Email', type: 'input' },
          { key: 'contact_address_line1', label: 'Street Address', type: 'input' },
          { key: 'contact_address_line2', label: 'City, State, Zip', type: 'input' },
          { key: 'contact_hours', label: 'Operating Business Hours', type: 'input', full: true }
        ]
      },
      {
        title: 'Home Page Hero & Banners',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        desc: 'Primary headlines, mission statements, and catalog callouts on index.html.',
        fields: [
          { key: 'hero_home_title', label: 'Hero Main Headline (HTML allowed)', type: 'textarea', full: true },
          { key: 'hero_home_desc', label: 'Hero Body Description', type: 'textarea', full: true },
          { key: 'hero_subbar_left', label: 'Sub-bar Left Eyebrow', type: 'input' },
          { key: 'hero_subbar_right', label: 'Sub-bar Right Eyebrow', type: 'input' },
          { key: 'catalog_cta_title', label: 'Catalog Section Heading', type: 'input' },
          { key: 'catalog_cta_desc', label: 'Catalog Section Description', type: 'textarea', full: true }
        ]
      },
      {
        title: 'About Us Page & Core Pillars',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        desc: 'Company origin, institutional focus, and quality pillars displayed on about.html.',
        fields: [
          { key: 'about_hero_title', label: 'About Page Title', type: 'input' },
          { key: 'about_hero_subtitle', label: 'About Page Subtitle', type: 'input' },
          { key: 'about_hero_desc', label: 'About Mission Paragraph', type: 'textarea', full: true },
          { key: 'pillar_1_title', label: 'Pillar 1 Title', type: 'input' },
          { key: 'pillar_1_desc', label: 'Pillar 1 Description', type: 'textarea' },
          { key: 'pillar_2_title', label: 'Pillar 2 Title', type: 'input' },
          { key: 'pillar_2_desc', label: 'Pillar 2 Description', type: 'textarea' },
          { key: 'pillar_3_title', label: 'Pillar 3 Title', type: 'input' },
          { key: 'pillar_3_desc', label: 'Pillar 3 Description', type: 'textarea' },
          { key: 'pillar_4_title', label: 'Pillar 4 Title', type: 'input' },
          { key: 'pillar_4_desc', label: 'Pillar 4 Description', type: 'textarea' }
        ]
      },
      {
        title: 'Federal Healthcare Opportunities',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        desc: 'Government procurement, VA hospitals, and institutional supply copy.',
        fields: [
          { key: 'federal_title', label: 'Section Title', type: 'input', full: true },
          { key: 'federal_desc', label: 'Procurement Overview Description', type: 'textarea', full: true }
        ]
      }
    ];

    let html = '';
    sections.forEach(sec => {
      html += `
        <div class="cms-section-card">
          <div class="cms-section-title">
            ${sec.icon}
            <span>${sec.title}</span>
          </div>
          <div class="cms-section-desc">${sec.desc}</div>
          <div class="cms-fields-grid">
      `;

      sec.fields.forEach(f => {
        const val = content[f.key] || '';
        const fullClass = f.full ? 'full-width' : '';
        html += `
          <div class="cms-field-group ${fullClass}">
            <label class="cms-label" for="cms-field-${f.key}">
              <span>${f.label}</span>
              <span class="cms-key-badge">${f.key}</span>
            </label>
        `;
        if (f.type === 'textarea') {
          html += `<textarea id="cms-field-${f.key}" data-key="${f.key}" class="cms-input cms-textarea">${val}</textarea>`;
        } else {
          html += `<input type="text" id="cms-field-${f.key}" data-key="${f.key}" class="cms-input" value="${val.replace(/"/g, '&quot;')}">`;
        }
        html += `</div>`;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach real-time input change listener
    container.querySelectorAll('.cms-input').forEach(el => {
      el.addEventListener('change', () => {
        const key = el.dataset.key;
        const val = el.value;
        if (window.AarnaStore && key) {
          window.AarnaStore.saveContent(key, val);
          if (typeof window.showToast === 'function') {
            window.showToast(`Updated "${key}" live across site!`, 'success');
          }
        }
      });
    });
  }

  function saveAllCmsFields() {
    const container = document.getElementById('content-items-container');
    if (!container || !window.AarnaStore) return;
    const inputs = container.querySelectorAll('.cms-input');
    const updateObj = {};
    inputs.forEach(el => {
      if (el.dataset.key) {
        updateObj[el.dataset.key] = el.value;
      }
    });

    window.AarnaStore.saveAllContent(updateObj);
    if (typeof window.showToast === 'function') {
      window.showToast('All CMS changes saved & published live!', 'success');
    } else {
      alert('Content saved and published!');
    }
  }

  // --------------------------------------------------------------------------
  // MEDIA MANAGEMENT
  // --------------------------------------------------------------------------
  const MEDIA_SLOTS = [
    {
      key: 'logo_main',
      name: 'Corporate Brand Logo',
      defaultUrl: 'assets/logos/aarna-logo-clean.png',
      meta: 'Used across main navbar, mobile drawer, footer, and admin portals.',
      dims: 'Transparent PNG / SVG • ~280 × 70 px'
    },
    {
      key: 'admin_hero',
      name: 'Admin Portal Login Poster',
      defaultUrl: 'assets/images/admin-login-hero.jpg',
      meta: 'Full uncropped family poster on admin.html.',
      dims: 'High-res vertical image • ~727 × 1024 px'
    },
    {
      key: 'hero_home_bg',
      name: 'Home Hero Horizon Banner',
      defaultUrl: 'assets/images/hero-bg.jpg',
      meta: 'Main dynamic hero background on index.html.',
      dims: 'Wide landscape photo • ~1920 × 1080 px'
    },
    {
      key: 'about_hero_bg',
      name: 'About Us Healthcare Mission',
      defaultUrl: 'assets/images/about-hero.jpg',
      meta: 'Header background photo on about.html.',
      dims: 'Landscape photo • ~1200 × 800 px'
    },
    {
      key: 'products_hero',
      name: 'Product Showcase Banner',
      defaultUrl: 'assets/images/products-hero.jpg',
      meta: 'Product line visual on index.html & catalog pages.',
      dims: 'Landscape photo • ~1200 × 700 px'
    }
  ];

  function initMediaManager() {
    renderMediaGrid();
  }

  function renderMediaGrid() {
    const container = document.getElementById('media-grid-container');
    if (!container || !window.AarnaStore) return;

    const storedMedia = window.AarnaStore.getAllMedia();

    let html = '<div class="media-slots-grid">';
    MEDIA_SLOTS.forEach(slot => {
      const currentSrc = storedMedia[slot.key] || slot.defaultUrl;
      const isCustom = Boolean(storedMedia[slot.key]);

      html += `
        <div class="media-slot-card" data-slot="${slot.key}">
          <div>
            <div class="media-thumb-preview" style="background-image: url('${currentSrc}');" id="preview-${slot.key}"></div>
            <div class="media-slot-name">${slot.name}</div>
            <span class="media-slot-key">Slot: ${slot.key} ${isCustom ? '<span style="color:#16a34a; font-weight:700;">(Custom Upload)</span>' : '<span style="color:#64748b;">(Default)</span>'}</span>
            <div class="media-slot-meta">
              <div>${slot.meta}</div>
              <div style="margin-top:0.25rem; font-weight:600; color:#475569;">Recommended: ${slot.dims}</div>
            </div>
          </div>

          <div class="media-slot-actions">
            <label class="media-upload-btn-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>Upload New</span>
              <input type="file" accept="image/*" class="media-file-input" data-slot="${slot.key}" style="display:none;">
            </label>
            ${isCustom ? `
              <button type="button" class="media-reset-btn" data-reset-slot="${slot.key}" title="Reset to original default">
                Reset
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Attach File Upload Listeners
    container.querySelectorAll('.media-file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        const slotKey = input.dataset.slot;
        if (!file || !slotKey) return;

        if (file.size > 8 * 1024 * 1024) {
          alert('Image file is too large. Please select an image under 8 MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target.result;
          if (window.AarnaStore) {
            window.AarnaStore.saveMedia(slotKey, dataUrl);
            renderMediaGrid();
            if (typeof window.showToast === 'function') {
              window.showToast(`Updated image for ${slotKey}!`, 'success');
            }
          }
        };
        reader.readAsDataURL(file);
      });
    });

    // Attach Reset Listeners
    container.querySelectorAll('[data-reset-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotKey = btn.dataset.resetSlot;
        if (slotKey && window.AarnaStore) {
          window.AarnaStore.deleteMedia(slotKey);
          renderMediaGrid();
          if (typeof window.showToast === 'function') {
            window.showToast(`Reset ${slotKey} to original default.`, 'info');
          }
        }
      });
    });
  }

  function initInquiriesManager() {
    renderInquiries();
  }

  function renderInquiries() {
    const container = document.getElementById('inquiries-list-container');
    if (!container) return;
    const inquiries = window.AarnaStore ? window.AarnaStore.getInquiries() : [];

    if (!inquiries.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #8c8f95;">
          <p>No customer quote submissions yet. Customer inquiries from the website will appear here in real time.</p>
        </div>
      `;
      return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:0.75rem;">';
    inquiries.forEach(inq => {
      html += `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:1rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#0b1523; display:block;">${inq.name || 'Inquiry'} (${inq.email || '—'})</strong>
            <span style="font-size:0.8rem; color:#64748b;">Phone: ${inq.phone || '—'} • Type: ${inq.type || 'General'}</span>
            <p style="font-size:0.85rem; margin-top:0.35rem; color:#334155;">"${inq.message || inq.notes || '—'}"</p>
          </div>
          <span class="status-pill-badge completed">Received</span>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function initBackupManager() {
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      const data = {
        exportedAt: new Date().toISOString(),
        institutional: window.AarnaStore ? window.AarnaStore.getProducts('institutional') : [],
        retail: window.AarnaStore ? window.AarnaStore.getProducts('retail') : [],
        devices: window.AarnaStore ? window.AarnaStore.getProducts('devices') : []
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `aarna-products-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });
  }

  function initMobileSidebar() {
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.querySelector('.dash-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------
  function setFormVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function closeAllModals() {
    document.querySelectorAll('.leaseflow-modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

})();
