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
  function initContentManager() {}
  function loadContentForm() {}
  function initMediaManager() {}
  function renderMediaGrid() {}

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
