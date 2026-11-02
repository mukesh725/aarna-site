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
    initTeamAndPermissionsManager();
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
      } else if (viewName === 'team') {
        mainTitleEl.textContent = 'Team & Superadmin Settings';
      }
    }

    if (viewName === 'catalogs') renderCatalogTable();
    if (viewName === 'content') loadContentForm();
    if (viewName === 'media') renderMediaGrid();
    if (viewName === 'inquiries') renderInquiries();
    if (viewName === 'team') renderTeamManagementView();
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
    const storedMedia = window.AarnaStore.getAllMedia();
    const customMedia = typeof window.AarnaStore.getCustomMedia === 'function' ? window.AarnaStore.getCustomMedia() : {};

    const sections = [
      {
        id: 'sec-brand',
        title: 'Global Brand & Company Contact',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
        desc: 'Brand identity, official contact details, and company information across all website headers, footers, and contact points.',
        images: [
          {
            key: 'logo_main',
            name: 'Corporate Brand Logo',
            meta: 'Used across main navbar, mobile menu, and footer on every page.',
            dims: 'Transparent PNG / SVG • ~280 × 70 px'
          },
          {
            key: 'admin_hero',
            name: 'Admin Portal Login Poster',
            meta: 'Full uncropped family portrait on admin.html login screen.',
            dims: 'High-res vertical photo • ~727 × 1024 px'
          }
        ],
        fields: [
          { key: 'company_name', label: 'Company Legal Name', type: 'input' },
          { key: 'company_tagline', label: 'Brand Tagline', type: 'input' },
          { key: 'footer_desc', label: 'Footer Mission Blurb', type: 'textarea', full: true },
          { key: 'contact_phone', label: 'Customer Service Phone', type: 'input' },
          { key: 'contact_email', label: 'Official Inquiries Email', type: 'input' },
          { key: 'contact_address_line1', label: 'Street Address', type: 'input' },
          { key: 'contact_address_line2', label: 'City, State, Zip', type: 'input' },
          { key: 'contact_hours', label: 'Operating Business Hours', type: 'input', full: true }
        ]
      },
      {
        id: 'sec-hero',
        title: 'Home Page - Section 1: Hero Horizon',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        desc: 'Primary landing hero section on index.html with headline, description, catalog CTA button, and social proof counter.',
        images: [
          {
            key: 'hero_bg',
            name: 'Hero Horizon Background Graphic',
            meta: 'Background photography and graphic inside the framed hero banner.',
            dims: 'Landscape photo • ~1920 × 1080 px'
          }
        ],
        fields: [
          { key: 'hero_home_title', label: 'Hero Main Headline (HTML allowed)', type: 'textarea', full: true },
          { key: 'hero_home_desc', label: 'Hero Body Description', type: 'textarea', full: true },
          { key: 'hero_catalog_btn', label: 'Hero Catalog Button Text', type: 'input' },
          { key: 'hero_subbar_left', label: 'Left Sub-bar Text', type: 'input' },
          { key: 'hero_subbar_right', label: 'Right Sub-bar Text', type: 'input' },
          { key: 'hero_proof_line1', label: 'Social Proof Line 1', type: 'input' },
          { key: 'hero_proof_line2', label: 'Social Proof Line 2', type: 'input' }
        ]
      },
      {
        id: 'sec-showcase',
        title: 'Home Page - Section 2: Product Showcase (3 Divisions)',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        desc: 'The 3 editorial category cards on index.html (Institutional Products, Retail Products, Medical Supplies) with titles, descriptions, pills, and card imagery.',
        images: [
          {
            key: 'card_institutional',
            name: 'Card 1: Institutional Products Visual',
            meta: 'Unit-dose liquid cups packaging visual for Card 1.',
            dims: 'High-res image • ~600 × 400 px'
          },
          {
            key: 'card_retail',
            name: 'Card 2: Retail Products Visual',
            meta: 'Solid dose bottles and OTC packaging visual for Card 2.',
            dims: 'High-res image • ~600 × 400 px'
          },
          {
            key: 'card_devices',
            name: 'Card 3: Medical Supplies Visual',
            meta: 'Clinical equipment, aerosol spacers, and needles visual for Card 3.',
            dims: 'High-res image • ~600 × 400 px'
          }
        ],
        fields: [
          { key: 'showcase_heading', label: 'Showcase Section Main Title', type: 'input', full: true },
          { key: 'card_inst_title', label: 'Card 1 Title (Institutional)', type: 'input' },
          { key: 'card_inst_desc', label: 'Card 1 Description', type: 'textarea', full: true },
          { key: 'card_inst_pill1', label: 'Card 1 Pill Tag 1', type: 'input' },
          { key: 'card_inst_pill2', label: 'Card 1 Pill Tag 2', type: 'input' },
          { key: 'card_retail_title', label: 'Card 2 Title (Retail)', type: 'input' },
          { key: 'card_retail_desc', label: 'Card 2 Description', type: 'textarea', full: true },
          { key: 'card_retail_pill1', label: 'Card 2 Pill Tag 1', type: 'input' },
          { key: 'card_retail_pill2', label: 'Card 2 Pill Tag 2', type: 'input' },
          { key: 'card_devices_title', label: 'Card 3 Title (Medical Supplies)', type: 'input' },
          { key: 'card_devices_desc', label: 'Card 3 Description', type: 'textarea', full: true },
          { key: 'card_devices_pill1', label: 'Card 3 Pill Tag 1', type: 'input' },
          { key: 'card_devices_pill2', label: 'Card 3 Pill Tag 2', type: 'input' }
        ]
      },
      {
        id: 'sec-pl',
        title: 'Home Page - Section 3: Private Label Solutions',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
        desc: 'Custom formulation packaging and private-label contract manufacturing showcase on index.html.',
        images: [
          {
            key: 'private_label_img',
            name: 'Private Label Packaging Showcase Graphic',
            meta: 'Display graphic showing custom branded bottles, cartons, and liquids.',
            dims: 'High-res image • ~700 × 500 px'
          }
        ],
        fields: [
          { key: 'pl_eyebrow', label: 'Eyebrow Tag', type: 'input' },
          { key: 'pl_title', label: 'Main Headline (HTML allowed)', type: 'textarea', full: true },
          { key: 'pl_desc', label: 'Body Description', type: 'textarea', full: true },
          { key: 'pl_btn_text', label: 'Action Button Text', type: 'input' },
          { key: 'pl_footnote', label: 'Target Audience Footnote', type: 'input', full: true }
        ]
      },
      {
        id: 'sec-serve',
        title: 'Home Page - Section 4: Who We Serve',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        desc: 'Institutional client sectors, healthcare channels, and group purchasing organizations on index.html.',
        fields: [
          { key: 'serve_eyebrow', label: 'Eyebrow Tag', type: 'input' },
          { key: 'serve_title', label: 'Main Headline (HTML allowed)', type: 'textarea', full: true },
          { key: 'serve_item1_title', label: 'Sector 1 Title (Hospitals)', type: 'input' },
          { key: 'serve_item1_sub', label: 'Sector 1 Subtitle', type: 'input' },
          { key: 'serve_item2_title', label: 'Sector 2 Title (Pharmacies)', type: 'input' },
          { key: 'serve_item3_title', label: 'Sector 3 Title (Retail & Customers)', type: 'input' },
          { key: 'serve_item4_title', label: 'Sector 4 Title (Private Label)', type: 'input' },
          { key: 'serve_footnote', label: 'Procurement Channels Footnote', type: 'input', full: true }
        ]
      },
      {
        id: 'sec-federal',
        title: 'Home Page - Section 5: Federal Healthcare Opportunities',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        desc: 'Government procurement, Veterans Affairs (VA) hospitals, and institutional supply copy on index.html.',
        fields: [
          { key: 'federal_title', label: 'Section Title', type: 'input', full: true },
          { key: 'federal_desc', label: 'Procurement Overview Description', type: 'textarea', full: true },
          { key: 'federal_btn_text', label: 'Procurement Action Button Text (HTML allowed)', type: 'input' }
        ]
      },
      {
        id: 'sec-partners',
        title: 'Home Page - Section 6: Our Partners (Wholesalers & GPOs)',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 12l-4-4-4 4"></path><path d="M12 16V8"></path></svg>',
        desc: 'Authorized national distribution partners and healthcare supply chain logos on index.html.',
        images: [
          {
            key: 'partner_cencora',
            name: 'Cencora / AmerisourceBergen Logo',
            meta: 'National distributor badge 1 on index.html.',
            dims: 'Transparent PNG / SVG logo'
          },
          {
            key: 'partner_cardinal',
            name: 'Cardinal Health Logo',
            meta: 'National distributor badge 2 on index.html.',
            dims: 'Transparent PNG / SVG logo'
          },
          {
            key: 'partner_mckesson',
            name: 'McKesson Logo',
            meta: 'National distributor badge 3 on index.html.',
            dims: 'Transparent PNG / SVG logo'
          },
          {
            key: 'partner_medline',
            name: 'Medline Logo',
            meta: 'National distributor badge 4 on index.html.',
            dims: 'Transparent PNG / SVG logo'
          }
        ],
        fields: [
          { key: 'partners_badge', label: 'Eyebrow Badge', type: 'input' },
          { key: 'partners_title', label: 'Section Headline (HTML allowed)', type: 'input', full: true },
          { key: 'partners_subtitle', label: 'Partners Subtitle Description', type: 'textarea', full: true }
        ]
      },
      {
        id: 'sec-cta',
        title: 'Home Page - Section 7: Catalog Callout Banner',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        desc: 'Callout banner above footer directing visitors to download or view the master catalog.',
        fields: [
          { key: 'catalog_cta_title', label: 'Banner Heading', type: 'input' },
          { key: 'catalog_cta_desc', label: 'Banner Description', type: 'textarea', full: true },
          { key: 'catalog_cta_btn', label: 'Catalog Button Text', type: 'input' }
        ]
      },
      {
        id: 'sec-about',
        title: 'About Us Page Content',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        desc: 'Company origin, institutional healthcare mission, and What We Do banner on about.html.',
        images: [
          {
            key: 'about_pharmacy',
            name: 'About Pharmacy Counter Visual',
            meta: 'Display visual on about.html showing pharmacy operations and packaging.',
            dims: 'High-res image • ~920 × 560 px'
          }
        ],
        fields: [
          { key: 'about_hero_title', label: 'About Page Main Title', type: 'input' },
          { key: 'about_hero_desc', label: 'About Mission Description', type: 'textarea', full: true },
          { key: 'about_what_title', label: 'What We Do Section Title', type: 'input' },
          { key: 'about_what_desc', label: 'What We Do Description', type: 'textarea', full: true }
        ]
      },
      {
        id: 'sec-contact',
        title: 'Contact Us Page Content',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        desc: 'Headings, inquiry guidance, and next-steps card on contact.html.',
        fields: [
          { key: 'contact_eyebrow', label: 'Eyebrow Tag', type: 'input' },
          { key: 'contact_hero_title', label: 'Contact Main Headline (HTML allowed)', type: 'textarea', full: true },
          { key: 'contact_hero_desc', label: 'Contact Subtitle Description', type: 'textarea', full: true },
          { key: 'contact_next_title', label: 'What Happens Next Box Title', type: 'input' },
          { key: 'contact_next_desc', label: 'What Happens Next Description', type: 'textarea', full: true }
        ]
      },
      {
        id: 'sec-catalog-pages',
        title: 'Dedicated Catalog Pages (3 Lines)',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
        desc: 'Hero banners, titles, and descriptions on institutional-products.html, retail-products.html, and medical-devices.html.',
        images: [
          {
            key: 'inst_hero_img',
            name: 'Institutional Catalog Hero Banner',
            meta: 'Displayed on institutional-products.html hero card.',
            dims: 'High-res image • ~600 × 400 px'
          },
          {
            key: 'retail_hero_img',
            name: 'Retail Catalog Hero Banner',
            meta: 'Displayed on retail-products.html hero card.',
            dims: 'High-res image • ~600 × 400 px'
          },
          {
            key: 'devices_hero_img',
            name: 'Medical Devices Catalog Hero Banner',
            meta: 'Displayed on medical-devices.html hero card.',
            dims: 'High-res image • ~600 × 400 px'
          }
        ],
        fields: [
          { key: 'inst_page_title', label: 'Institutional Page Title', type: 'input' },
          { key: 'inst_page_desc', label: 'Institutional Page Description', type: 'textarea', full: true },
          { key: 'retail_page_title', label: 'Retail Page Title', type: 'input' },
          { key: 'retail_page_desc', label: 'Retail Page Description', type: 'textarea', full: true },
          { key: 'devices_page_title', label: 'Medical Supplies & Devices Page Title', type: 'input' },
          { key: 'devices_page_desc', label: 'Medical Supplies & Devices Page Description', type: 'textarea', full: true }
        ]
      }
    ];

    let html = '';
    sections.forEach(sec => {
      html += `
        <div class="cms-section-card" id="${sec.id}">
          <div class="cms-section-title">
            ${sec.icon}
            <span>${sec.title}</span>
          </div>
          <div class="cms-section-desc">${sec.desc}</div>
      `;

      // Render integrated Section Images if section has images
      if (sec.images && sec.images.length > 0) {
        html += `
          <div class="cms-section-images-wrap">
            <div class="cms-section-images-header">
              <span class="cms-section-images-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span>Images in this Section</span>
              </span>
              <span class="cms-section-images-badge">${sec.images.length} Image${sec.images.length > 1 ? 's' : ''} Available</span>
            </div>
            <div class="cms-section-images-grid">
        `;

        sec.images.forEach(img => {
          const currentSrc = storedMedia[img.key] || (window.AarnaStore.getDefaultMedia ? window.AarnaStore.getDefaultMedia(img.key) : '');
          const isCustom = Boolean(customMedia[img.key]);

          html += `
            <div class="cms-image-slot-item" data-slot="${img.key}">
              <div>
                <div class="cms-image-slot-preview" id="cms-img-preview-${img.key}" style="background-image: url('${currentSrc}');"></div>
                <div class="cms-image-slot-label">${img.name}</div>
                <span class="cms-image-slot-key">Slot: ${img.key} ${isCustom ? '<span style="color:#16a34a; font-weight:700;">(Custom Upload)</span>' : '<span style="color:#64748b;">(Default)</span>'}</span>
                <div class="cms-image-slot-meta">
                  <div>${img.meta}</div>
                  <div style="margin-top:0.25rem; font-weight:600; color:#475569;">Recommended: ${img.dims}</div>
                </div>
              </div>

              <div class="cms-image-slot-actions">
                <label class="cms-image-upload-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <span>Upload / Replace</span>
                  <input type="file" accept="image/*" class="cms-image-file-input" data-slot="${img.key}" style="display:none;">
                </label>
                ${isCustom ? `
                  <button type="button" class="cms-image-reset-btn" data-reset-slot="${img.key}" title="Reset to original default image">
                    Reset
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }

      // Render Text Fields
      html += `<div class="cms-fields-grid">`;
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

    // Attach real-time input change listeners
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

    // Attach File Upload Listeners to Section Images
    container.querySelectorAll('.cms-image-file-input').forEach(input => {
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
            loadContentForm();
            if (typeof renderMediaGrid === 'function') {
              renderMediaGrid();
            }
            if (typeof window.showToast === 'function') {
              window.showToast(`Updated image for "${slotKey}" live across site!`, 'success');
            }
          }
        };
        reader.readAsDataURL(file);
      });
    });

    // Attach Reset Listeners to Section Images
    container.querySelectorAll('.cms-image-reset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotKey = btn.dataset.resetSlot;
        if (slotKey && window.AarnaStore) {
          window.AarnaStore.deleteMedia(slotKey);
          loadContentForm();
          if (typeof renderMediaGrid === 'function') {
            renderMediaGrid();
          }
          if (typeof window.showToast === 'function') {
            window.showToast(`Reset "${slotKey}" to original default image.`, 'info');
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

    const success = window.AarnaStore.saveContent(updateObj);
    if (success) {
      const saveBtn = document.getElementById('btn-cms-save-all');
      if (saveBtn) {
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Saved &amp; Published Live!</span>
        `;
        saveBtn.style.background = '#059669';
        setTimeout(() => {
          saveBtn.innerHTML = originalHtml;
          saveBtn.style.background = '';
        }, 3000);
      }
      alert('Content successfully saved and published live to website! Changes are visible immediately across all pages.');
    } else {
      alert('Error saving content. Please try again.');
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
      key: 'hero_bg',
      name: 'Home Hero Horizon Banner',
      defaultUrl: 'assets/images/hero-tablets-bg.jpg',
      meta: 'Main dynamic hero background on index.html.',
      dims: 'Wide landscape photo • ~1920 × 1080 px'
    },
    {
      key: 'card_institutional',
      name: 'Card 1: Institutional Products Visual',
      defaultUrl: 'assets/images/card-institutional.png',
      meta: 'Unit-dose liquid cups packaging visual for Card 1 on index.html.',
      dims: 'High-res image • ~600 × 400 px'
    },
    {
      key: 'card_retail',
      name: 'Card 2: Retail Products Visual',
      defaultUrl: 'assets/images/card-retail.png',
      meta: 'Solid dose bottles and OTC packaging visual for Card 2 on index.html.',
      dims: 'High-res image • ~600 × 400 px'
    },
    {
      key: 'card_devices',
      name: 'Card 3: Medical Supplies Visual',
      defaultUrl: 'assets/images/card-medical-devices.png',
      meta: 'Clinical equipment and supplies visual for Card 3 on index.html.',
      dims: 'High-res image • ~600 × 400 px'
    },
    {
      key: 'private_label_img',
      name: 'Private Label Packaging Graphic',
      defaultUrl: 'assets/images/private-label-blue-card.png',
      meta: 'Custom packaging showcase visual on index.html.',
      dims: 'High-res image • ~700 × 500 px'
    },
    {
      key: 'partner_cencora',
      name: 'Cencora / AmerisourceBergen Logo',
      defaultUrl: 'assets/logos/logo-cencora-ref.png',
      meta: 'National distributor badge 1 on index.html.',
      dims: 'Transparent PNG / SVG logo'
    },
    {
      key: 'partner_cardinal',
      name: 'Cardinal Health Logo',
      defaultUrl: 'assets/logos/logo-cardinal-ref.png',
      meta: 'National distributor badge 2 on index.html.',
      dims: 'Transparent PNG / SVG logo'
    },
    {
      key: 'partner_mckesson',
      name: 'McKesson Logo',
      defaultUrl: 'assets/logos/logo-mckesson-ref.png',
      meta: 'National distributor badge 3 on index.html.',
      dims: 'Transparent PNG / SVG logo'
    },
    {
      key: 'partner_medline',
      name: 'Medline Logo',
      defaultUrl: 'assets/logos/logo-medline-ref.png',
      meta: 'National distributor badge 4 on index.html.',
      dims: 'Transparent PNG / SVG logo'
    },
    {
      key: 'about_pharmacy',
      name: 'About Pharmacy Counter Visual',
      defaultUrl: 'assets/images/about-pharmacy-counter.png',
      meta: 'Healthcare operations visual on about.html.',
      dims: 'High-res image • ~920 × 560 px'
    },
    {
      key: 'inst_hero_img',
      name: 'Institutional Catalog Hero Banner',
      defaultUrl: 'assets/images/cups-liquid-dosage.png',
      meta: 'Displayed on institutional-products.html hero card.',
      dims: 'High-res image • ~600 × 400 px'
    },
    {
      key: 'retail_hero_img',
      name: 'Retail Catalog Hero Banner',
      defaultUrl: 'assets/images/bottles-solid-dosage.png',
      meta: 'Displayed on retail-products.html hero card.',
      dims: 'High-res image • ~600 × 400 px'
    },
    {
      key: 'devices_hero_img',
      name: 'Medical Devices Catalog Hero Banner',
      defaultUrl: 'assets/images/card-medical-devices.png',
      meta: 'Displayed on medical-devices.html hero card.',
      dims: 'High-res image • ~600 × 400 px'
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

  // --------------------------------------------------------------------------
  // TEAM ROLES & SUPERADMIN TAB VISIBILITY SETTINGS
  // --------------------------------------------------------------------------
  const ALL_DASHBOARD_TABS = [
    { id: 'overview', name: 'Dashboard Overview', desc: 'Overall pipeline stats, lead metrics, catalog tallies', icon: '📊', selector: '.dash-nav-item[data-view="overview"]' },
    { id: 'catalog_institutional', name: 'Institutional Care', desc: 'Unit-dose cups, oral solutions, liquid pharmaceuticals', icon: '🏥', selector: '.dash-nav-item[data-view="catalogs"][data-catalog="institutional"]' },
    { id: 'catalog_retail', name: 'Retail Products', desc: 'OTC tablets, pain relief, allergy, gastrointestinal', icon: '💊', selector: '.dash-nav-item[data-view="catalogs"][data-catalog="retail"]' },
    { id: 'catalog_devices', name: 'Medical Supplies', desc: 'Surgical tapes, wound care, syringes, clinical disposables', icon: '🩺', selector: '.dash-nav-item[data-view="catalogs"][data-catalog="devices"]' },
    { id: 'inquiries', name: 'Inquiries & Leads', desc: 'Customer inquiries, RFQ submissions, order requests', icon: '📬', selector: '.dash-nav-item[data-view="inquiries"]' },
    { id: 'content', name: 'Site Content (CMS)', desc: 'Live homepage text, badges, headers, hero updates', icon: '📝', selector: '.dash-nav-item[data-view="content"]' },
    { id: 'media', name: 'Media & Images', desc: 'Image replacement, product photography, banners', icon: '🖼️', selector: '.dash-nav-item[data-view="media"]' },
    { id: 'settings', name: 'Settings & Backups', desc: 'JSON catalog export, Firebase synchronization', icon: '⚙️', selector: '.dash-nav-item[data-view="settings"]' },
    { id: 'team', name: 'Team & Roles', desc: 'Superadmin governance, role tab visibility matrix', icon: '👑', selector: '.dash-nav-item[data-view="team"]' }
  ];

  const DEFAULT_ROLE_PERMS = {
    superadmin: ['overview', 'catalog_institutional', 'catalog_retail', 'catalog_devices', 'inquiries', 'content', 'media', 'settings', 'team'],
    catalog_manager: ['catalog_institutional', 'catalog_retail', 'catalog_devices', 'media'],
    content_editor: ['content', 'media'],
    sales_support: ['inquiries', 'overview']
  };

  const DEFAULT_TEAM_MEMBERS = [
    { id: 'usr-1', name: 'Aarna Super Admin', email: 'admin@aarnaus.com', role: 'superadmin', customTabs: [], status: 'Active' },
    { id: 'usr-2', name: 'Rachel Stevens', email: 'catalog.manager@aarnaus.com', role: 'catalog_manager', customTabs: [], status: 'Active' },
    { id: 'usr-3', name: 'David Miller', email: 'editor@aarnaus.com', role: 'content_editor', customTabs: [], status: 'Active' },
    { id: 'usr-4', name: 'Emily Zhang', email: 'sales@aarnaus.com', role: 'sales_support', customTabs: [], status: 'Active' }
  ];

  let activeEditingMemberId = null;

  function getStoredRolePermissions() {
    try {
      const stored = localStorage.getItem('aarna_role_permissions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMS));
  }

  function saveStoredRolePermissions(perms) {
    localStorage.setItem('aarna_role_permissions', JSON.stringify(perms));
  }

  function getStoredTeamMembers() {
    try {
      const stored = localStorage.getItem('aarna_team_members');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_TEAM_MEMBERS));
  }

  function saveStoredTeamMembers(members) {
    localStorage.setItem('aarna_team_members', JSON.stringify(members));
  }

  function getRoleDisplayName(roleKey) {
    switch (roleKey) {
      case 'superadmin': return 'Superadmin';
      case 'catalog_manager': return 'Catalog Manager';
      case 'content_editor': return 'Content Specialist';
      case 'sales_support': return 'Sales Representative';
      case 'custom': return 'Custom Permissions';
      default: return capitalize(roleKey);
    }
  }

  function initTeamAndPermissionsManager() {
    // Determine active role from session or simulator
    let activeRole = 'superadmin';
    try {
      const user = JSON.parse(sessionStorage.getItem('aarna_admin_user') || '{}');
      if (user.role) {
        const r = user.role.toLowerCase().replace(/[^a-z]/g, '_');
        if (DEFAULT_ROLE_PERMS[r]) activeRole = r;
      }
    } catch (e) {}

    const savedSimRole = localStorage.getItem('aarna_simulated_role');
    if (savedSimRole && DEFAULT_ROLE_PERMS[savedSimRole]) {
      activeRole = savedSimRole;
    }

    // Apply permissions to sidebar immediately on boot
    applyRolePermissions(activeRole);

    // Setup Simulator Dropdown Listener
    const simSelect = document.getElementById('role-simulator-select');
    if (simSelect) {
      simSelect.value = activeRole;
      simSelect.addEventListener('change', (e) => {
        const newRole = e.target.value;
        localStorage.setItem('aarna_simulated_role', newRole);
        applyRolePermissions(newRole);
        renderTeamManagementView();
      });
    }

    // Save Permissions Button
    document.getElementById('btn-save-role-perms')?.addEventListener('click', () => {
      const simSelect = document.getElementById('role-simulator-select');
      const targetRole = simSelect ? simSelect.value : 'superadmin';
      const perms = getStoredRolePermissions();
      
      const checkedTabs = [];
      document.querySelectorAll('#tabs-matrix-container input[data-tab-id]:checked').forEach(input => {
        checkedTabs.push(input.dataset.tabId);
      });

      perms[targetRole] = checkedTabs;
      saveStoredRolePermissions(perms);
      applyRolePermissions(targetRole);

      alert(`Permissions updated successfully for "${getRoleDisplayName(targetRole)}"! Sidebar tabs updated in real time.`);
    });

    // Reset Defaults Button
    document.getElementById('btn-reset-role-perms')?.addEventListener('click', () => {
      const simSelect = document.getElementById('role-simulator-select');
      const targetRole = simSelect ? simSelect.value : 'superadmin';
      if (confirm(`Reset permissions for "${getRoleDisplayName(targetRole)}" back to recommended system defaults?`)) {
        const perms = getStoredRolePermissions();
        perms[targetRole] = DEFAULT_ROLE_PERMS[targetRole] ? [...DEFAULT_ROLE_PERMS[targetRole]] : [...DEFAULT_ROLE_PERMS.superadmin];
        saveStoredRolePermissions(perms);
        applyRolePermissions(targetRole);
        renderTeamManagementView();
      }
    });

    // Add Member Button & Modal Setup
    const addMemberBtn = document.getElementById('btn-add-team-member');
    const memberModal = document.getElementById('team-member-modal');
    const memberForm = document.getElementById('team-member-form');
    const memberRoleSelect = document.getElementById('member-role');

    if (addMemberBtn && memberModal) {
      addMemberBtn.addEventListener('click', () => {
        activeEditingMemberId = null;
        document.getElementById('team-modal-title').textContent = 'Add Team Member';
        memberForm.reset();
        populateModalTabsChecklist('superadmin');
        memberModal.classList.add('open');
      });
    }

    if (memberRoleSelect) {
      memberRoleSelect.addEventListener('change', (e) => {
        populateModalTabsChecklist(e.target.value);
      });
    }

    if (memberForm) {
      memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('member-name').value.trim();
        const email = document.getElementById('member-email').value.trim();
        const password = document.getElementById('member-password').value.trim() || 'aarna2026';
        const role = document.getElementById('member-role').value;

        const customTabs = [];
        document.querySelectorAll('#modal-tabs-checklist input[data-modal-tab]:checked').forEach(cb => {
          customTabs.push(cb.dataset.modalTab);
        });

        const members = getStoredTeamMembers();
        if (activeEditingMemberId) {
          const idx = members.findIndex(m => m.id === activeEditingMemberId);
          if (idx > -1) {
            members[idx].name = name;
            members[idx].email = email;
            members[idx].password = password;
            members[idx].role = role;
            members[idx].customTabs = customTabs;
          }
        } else {
          members.push({
            id: 'usr-' + Date.now(),
            name,
            email,
            password,
            role,
            customTabs,
            status: 'Active'
          });
        }

        saveStoredTeamMembers(members);
        closeAllModals();
        renderTeamMembersTable();
        alert('Team member saved successfully!');
      });
    }

    // Initial render if in team view
    if (currentView === 'team') {
      renderTeamManagementView();
    }
  }

  function applyRolePermissions(roleName, customTabsList = null) {
    const rolePerms = getStoredRolePermissions();
    const allowedTabs = customTabsList || rolePerms[roleName] || rolePerms['superadmin'] || [];

    // Update active role badge & title in UI
    const roleText = document.getElementById('current-active-role-text');
    if (roleText) {
      roleText.textContent = getRoleDisplayName(roleName);
    }
    const userInfoRole = document.querySelector('.dash-user-info span');
    if (userInfoRole) {
      userInfoRole.textContent = getRoleDisplayName(roleName);
    }

    // Toggle individual sidebar navigation tabs
    ALL_DASHBOARD_TABS.forEach(tab => {
      const btn = document.querySelector(tab.selector);
      if (btn) {
        const isAllowed = allowedTabs.includes(tab.id);
        btn.style.display = isAllowed ? 'flex' : 'none';
      }
    });

    // Toggle Sidebar Group Headers if child tabs are hidden
    const hasCatalogs = allowedTabs.some(t => t.startsWith('catalog_'));
    const sectionLabels = document.querySelectorAll('.dash-nav-section-label');
    if (sectionLabels[0]) sectionLabels[0].style.display = hasCatalogs ? 'block' : 'none';

    const hasWorkspace = allowedTabs.some(t => ['content', 'media', 'settings'].includes(t));
    if (sectionLabels[1]) sectionLabels[1].style.display = hasWorkspace ? 'block' : 'none';

    const hasGov = allowedTabs.includes('team');
    const govLabel = document.getElementById('section-admin-label');
    if (govLabel) govLabel.style.display = hasGov ? 'block' : 'none';

    // Auto-redirect if user is currently on an unpermitted tab
    const curTabId = getCurrentActiveTabId();
    if (!allowedTabs.includes(curTabId)) {
      const fallbackTab = ALL_DASHBOARD_TABS.find(t => allowedTabs.includes(t.id));
      if (fallbackTab) {
        if (fallbackTab.id.startsWith('catalog_')) {
          switchView('catalogs');
          switchCatalog(fallbackTab.id.replace('catalog_', ''));
        } else {
          switchView(fallbackTab.id);
        }
      }
    }
  }

  function getCurrentActiveTabId() {
    if (currentView === 'catalogs') {
      return `catalog_${currentCatalog}`;
    }
    return currentView;
  }

  function renderTeamManagementView() {
    const simSelect = document.getElementById('role-simulator-select');
    const targetRole = simSelect ? simSelect.value : 'superadmin';
    const perms = getStoredRolePermissions();
    const activeAllowed = perms[targetRole] || perms.superadmin;

    // Render Matrix of Tab Switch Cards
    const container = document.getElementById('tabs-matrix-container');
    if (container) {
      container.innerHTML = ALL_DASHBOARD_TABS.map(tab => {
        const isChecked = activeAllowed.includes(tab.id);
        return `
          <div class="tab-permission-card ${isChecked ? 'active-perm' : ''}">
            <div class="tab-card-left">
              <div class="tab-icon-box">${tab.icon}</div>
              <div>
                <div class="tab-info-title">${tab.name}</div>
                <div class="tab-info-desc">${tab.desc}</div>
              </div>
            </div>
            <label class="switch-toggle-label">
              <input type="checkbox" data-tab-id="${tab.id}" ${isChecked ? 'checked' : ''} onchange="this.closest('.tab-permission-card').classList.toggle('active-perm', this.checked)">
              <span class="switch-slider"></span>
            </label>
          </div>
        `;
      }).join('');
    }

    renderTeamMembersTable();
  }

  function renderTeamMembersTable() {
    const tbody = document.getElementById('team-members-tbody');
    if (!tbody) return;

    const members = getStoredTeamMembers();
    const perms = getStoredRolePermissions();

    tbody.innerHTML = members.map(m => {
      const allowed = m.role === 'custom' ? (m.customTabs || []) : (perms[m.role] || []);
      const roleClass = `role-${m.role.replace('_', '')}`;
      const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      const tabPills = allowed.map(tabId => {
        const tabObj = ALL_DASHBOARD_TABS.find(t => t.id === tabId);
        return `<span class="tab-chip-pill">${tabObj ? tabObj.name : tabId}</span>`;
      }).join('');

      return `
        <tr>
          <td>
            <div class="team-member-cell">
              <div class="team-member-avatar">${initials}</div>
              <div>
                <strong style="color:#0b1523; display:block;">${m.name}</strong>
                <span style="color:#64748b; font-size:0.8rem;">${m.email}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="team-role-pill ${roleClass}">${getRoleDisplayName(m.role)}</span>
          </td>
          <td>
            <div class="tab-badge-list">
              ${tabPills || '<span style="color:#94a3b8; font-size:0.75rem;">No tabs assigned</span>'}
            </div>
          </td>
          <td>
            <span style="display:inline-flex; align-items:center; gap:0.35rem; color:#16a34a; font-weight:600; font-size:0.82rem;">
              <span style="width:6px; height:6px; border-radius:50%; background:#16a34a;"></span>
              ${m.status || 'Active'}
            </span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="dash-icon-btn btn-edit-member" data-member-id="${m.id}" title="Edit Team Member" style="margin-right: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            ${m.email !== 'admin@aarnaus.com' ? `
              <button type="button" class="dash-icon-btn btn-delete-member" data-member-id="${m.id}" title="Remove Member" style="color: #ef4444;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    // Wire up edit buttons
    tbody.querySelectorAll('.btn-edit-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const memberId = btn.dataset.memberId;
        const member = members.find(m => m.id === memberId);
        if (member) {
          activeEditingMemberId = memberId;
          document.getElementById('team-modal-title').textContent = 'Edit Team Member & Permissions';
          document.getElementById('member-name').value = member.name;
          document.getElementById('member-email').value = member.email;
          document.getElementById('member-password').value = member.password || 'aarna2026';
          document.getElementById('member-role').value = member.role;
          populateModalTabsChecklist(member.role, member.customTabs);
          document.getElementById('team-member-modal').classList.add('open');
        }
      });
    });

    // Wire up delete buttons
    tbody.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const memberId = btn.dataset.memberId;
        const member = members.find(m => m.id === memberId);
        if (member && confirm(`Remove team member "${member.name}" (${member.email})?`)) {
          const updated = members.filter(m => m.id !== memberId);
          saveStoredTeamMembers(updated);
          renderTeamMembersTable();
        }
      });
    });
  }

  function populateModalTabsChecklist(selectedRole, customList = null) {
    const container = document.getElementById('modal-tabs-checklist');
    if (!container) return;

    const perms = getStoredRolePermissions();
    const activeList = customList || perms[selectedRole] || perms.superadmin || [];

    container.innerHTML = ALL_DASHBOARD_TABS.map(tab => {
      const isChecked = activeList.includes(tab.id);
      return `
        <label style="display:flex; align-items:center; gap:0.45rem; font-size:0.82rem; cursor:pointer; color:#1e293b;">
          <input type="checkbox" data-modal-tab="${tab.id}" ${isChecked ? 'checked' : ''} style="accent-color:#2563eb; width:15px; height:15px;">
          <span>${tab.icon} ${tab.name}</span>
        </label>
      `;
    }).join('');
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
