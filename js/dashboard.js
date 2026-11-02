/**
 * AARNA USA - Admin Dashboard Application Logic
 * Full CRUD for Products, Dynamic CMS Content, Media Manager, Inquiries & Backups.
 */

(function () {
  'use strict';

  // State
  let currentView = 'overview';
  let currentCatalog = 'institutional';
  let catalogSearchQuery = '';
  let catalogCategoryFilter = 'All';
  let activeEditProductId = null;
  let activeMediaSlotKey = null;

  // Cache DOM
  const navItems = document.querySelectorAll('.dash-nav-item[data-view]');
  const views = document.querySelectorAll('.dash-view');
  const breadcrumbCurrent = document.getElementById('dash-breadcrumb-current');
  const catalogTabs = document.querySelectorAll('.dash-catalog-tab');
  const catalogSearchInput = document.getElementById('dash-catalog-search');
  const catalogCategorySelect = document.getElementById('dash-catalog-cat-filter');
  const catalogTableBody = document.getElementById('dash-catalog-tbody');
  const catalogCountEl = document.getElementById('dash-catalog-count');

  // Modals
  const productModal = document.getElementById('product-modal');
  const productForm = document.getElementById('product-form');
  const productModalTitle = document.getElementById('product-modal-title');
  const deleteModal = document.getElementById('delete-modal');
  const deleteConfirmBtn = document.getElementById('confirm-delete-btn');
  const mediaModal = document.getElementById('media-modal');
  const mediaFileInput = document.getElementById('media-file-input');
  const mediaPreviewImg = document.getElementById('media-preview-img');
  const mediaSlotNameEl = document.getElementById('media-slot-name');

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initAuthManager();
    initNavigation();
    initStats();
    initCatalogManager();
    initContentManager();
    initMediaManager();
    initInquiriesManager();
    initBackupManager();
    initMobileSidebar();

    // Listen to store updates
    window.addEventListener('aarna:datachange', () => {
      initStats();
      if (currentView === 'catalogs') renderCatalogTable();
      if (currentView === 'inquiries') renderInquiries();
      if (currentView === 'media') renderMediaGrid();
    });
  });

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

        // Close mobile drawer if open
        document.querySelector('.dash-sidebar')?.classList.remove('open');
      });
    });

    // Quick Action buttons on Overview page
    document.querySelectorAll('[data-dash-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.dashAction;
        if (action === 'add-product') {
          switchView('catalogs');
          openAddProductModal();
        } else if (action === 'edit-content') {
          switchView('content');
        } else if (action === 'upload-media') {
          switchView('media');
        } else if (action === 'view-inquiries') {
          switchView('inquiries');
        }
      });
    });

    // Check URL params or hash for initial view (e.g. dashboard.html?view=media)
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view') || window.location.hash.replace('#', '');
    if (initialView && ['overview', 'catalogs', 'content', 'media', 'inquiries', 'backup'].includes(initialView)) {
      switchView(initialView);
    }
  }

  function switchView(viewName) {
    currentView = viewName;
    navItems.forEach(i => i.classList.toggle('active', i.dataset.view === viewName && (!i.dataset.catalog || i.dataset.catalog === currentCatalog)));
    views.forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));

    const activeNav = Array.from(navItems).find(i => i.dataset.view === viewName);
    if (breadcrumbCurrent && activeNav) {
      breadcrumbCurrent.textContent = activeNav.querySelector('.dash-nav-text')?.textContent || viewName;
    }

    if (viewName === 'catalogs') renderCatalogTable();
    if (viewName === 'content') loadContentForm();
    if (viewName === 'media') renderMediaGrid();
    if (viewName === 'inquiries') renderInquiries();
  }

  function switchCatalog(catalogType) {
    currentCatalog = catalogType;
    catalogTabs.forEach(t => t.classList.toggle('active', t.dataset.catalog === catalogType));
    
    // Toggle case size field visibility in modal
    const caseSizeGroup = document.getElementById('field-group-case-size');
    if (caseSizeGroup) {
      caseSizeGroup.style.display = catalogType === 'institutional' ? 'block' : 'none';
    }

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

  // --------------------------------------------------------------------------
  // OVERVIEW & STATS
  // --------------------------------------------------------------------------
  function initStats() {
    const retail = window.AarnaStore.getProducts('retail');
    const devices = window.AarnaStore.getProducts('devices');
    const inst = window.AarnaStore.getProducts('institutional');
    const inquiries = window.AarnaStore.getInquiries();
    const unreadInquiries = inquiries.filter(i => i.status === 'unread');

    setVal('stat-total-products', retail.length + devices.length + inst.length);
    setVal('stat-retail-count', retail.length);
    setVal('stat-devices-count', devices.length);
    setVal('stat-inst-count', inst.length);
    setVal('stat-inquiries-count', inquiries.length);

    // Sidebar badges
    setVal('badge-retail-count', retail.length);
    setVal('badge-devices-count', devices.length);
    setVal('badge-inst-count', inst.length);
    setVal('badge-inquiries-count', unreadInquiries.length);
    
    const bellBadge = document.getElementById('topbar-unread-badge');
    if (bellBadge) {
      bellBadge.textContent = unreadInquiries.length;
      bellBadge.style.display = unreadInquiries.length > 0 ? 'inline-block' : 'none';
    }

    // Storage Usage
    calculateStorageUsage();
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function calculateStorageUsage() {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('aarna_')) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    const kb = (totalBytes / 1024).toFixed(1);
    setVal('stat-storage-usage', `${kb} KB`);
  }

  // --------------------------------------------------------------------------
  // CATALOG MANAGER (CRUD)
  // --------------------------------------------------------------------------
  function initCatalogManager() {
    catalogTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchCatalog(tab.dataset.catalog);
      });
    });

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

    // Add Product Button
    document.getElementById('dash-add-product-btn')?.addEventListener('click', openAddProductModal);

    // Product Form Submit
    if (productForm) {
      productForm.addEventListener('submit', handleProductFormSubmit);
    }

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeAllModals();
      });
    });

    // Delete confirm
    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener('click', () => {
        if (activeEditProductId) {
          window.AarnaStore.deleteProduct(currentCatalog, activeEditProductId);
          window.showToast?.('Product deleted successfully', 'success') || alert('Product deleted');
          closeAllModals();
          renderCatalogTable();
          initStats();
        }
      });
    }
  }

  function populateCategoryFilter() {
    if (!catalogCategorySelect) return;
    const items = window.AarnaStore.getProducts(currentCatalog);
    const categories = new Set();
    items.forEach(it => {
      if (it.category) categories.add(it.category);
    });

    let opts = '<option value="All">All Categories</option>';
    categories.forEach(cat => {
      opts += `<option value="${cat}">${cat}</option>`;
    });
    catalogCategorySelect.innerHTML = opts;
  }

  function renderCatalogTable() {
    if (!catalogTableBody) return;
    const items = window.AarnaStore.getProducts(currentCatalog);

    const filtered = items.filter(item => {
      const matchCat = (catalogCategoryFilter === 'All') || (item.category === catalogCategoryFilter);
      const matchQuery = !catalogSearchQuery || 
        (item.description && item.description.toLowerCase().includes(catalogSearchQuery)) ||
        (item.ndc && item.ndc.toLowerCase().includes(catalogSearchQuery)) ||
        (item.category && item.category.toLowerCase().includes(catalogSearchQuery));
      return matchCat && matchQuery;
    });

    if (catalogCountEl) {
      catalogCountEl.textContent = `Showing ${filtered.length} of ${items.length} products`;
    }

    if (filtered.length === 0) {
      catalogTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 0.75rem; display: block; color: #cbd5e1;">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <strong style="display: block; font-size: 1rem; color: #0f172a; margin-bottom: 0.25rem;">No products match your criteria</strong>
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

      rowsHtml += `
        <tr data-id="${item.id}">
          <td style="font-weight: 600; color: #0f172a; max-width: 320px;">
            ${item.description}
          </td>
          <td><span class="dash-cat-pill">${item.category || 'General'}</span></td>
          <td>${item.unit || 'EA'}</td>
          <td>${isDevices ? (item.packQty || '100') : (item.caseQty || item.packQty || '—')}</td>
          <td><span class="dash-ndc-pill">${item.ndc}</span></td>
          ${isInstitutional ? `<td><strong>${item.caseSize || '—'}</strong></td>` : ''}
          <td>
            <div class="dash-action-btns">
              <button class="dash-icon-btn edit-prod-btn" title="Edit Product" data-id="${item.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="dash-icon-btn danger delete-prod-btn" title="Delete Product" data-id="${item.id}">
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
    if (productModalTitle) productModalTitle.textContent = `Add Product to ${capitalize(currentCatalog)} Catalog`;
    if (productForm) productForm.reset();

    // Toggle case size field
    const caseSizeGroup = document.getElementById('field-group-case-size');
    if (caseSizeGroup) {
      caseSizeGroup.style.display = currentCatalog === 'institutional' ? 'block' : 'none';
    }

    if (productModal) productModal.classList.add('open');
  }

  function openEditProductModal(id) {
    activeEditProductId = id;
    const items = window.AarnaStore.getProducts(currentCatalog);
    const item = items.find(it => it.id === id);
    if (!item) return;

    if (productModalTitle) productModalTitle.textContent = `Edit Product (${item.ndc})`;
    
    // Fill fields
    setFormVal('prod-desc', item.description);
    setFormVal('prod-category', item.category);
    setFormVal('prod-unit', item.unit || 'EA');
    setFormVal('prod-case-qty', item.caseQty || item.packQty || '');
    setFormVal('prod-ndc', item.ndc);
    setFormVal('prod-case-size', item.caseSize || '');

    const caseSizeGroup = document.getElementById('field-group-case-size');
    if (caseSizeGroup) {
      caseSizeGroup.style.display = currentCatalog === 'institutional' ? 'block' : 'none';
    }

    if (productModal) productModal.classList.add('open');
  }

  function openDeleteProductModal(id) {
    activeEditProductId = id;
    const items = window.AarnaStore.getProducts(currentCatalog);
    const item = items.find(it => it.id === id);
    if (!item) return;

    const descEl = document.getElementById('delete-prod-desc');
    if (descEl) descEl.textContent = `"${item.description}" (${item.ndc})`;

    if (deleteModal) deleteModal.classList.add('open');
  }

  function handleProductFormSubmit(e) {
    e.preventDefault();
    const desc = document.getElementById('prod-desc')?.value.trim();
    const cat = document.getElementById('prod-category')?.value.trim();
    const unit = document.getElementById('prod-unit')?.value.trim() || 'EA';
    const qty = document.getElementById('prod-case-qty')?.value.trim();
    const ndc = document.getElementById('prod-ndc')?.value.trim();
    const caseSize = document.getElementById('prod-case-size')?.value.trim();

    if (!desc || !ndc) {
      alert('Product Description and NDC are required fields.');
      return;
    }

    const payload = {
      description: desc,
      category: cat || 'General',
      unit: unit,
      ndc: ndc
    };

    if (currentCatalog === 'devices') {
      payload.packQty = qty || '100';
    } else {
      payload.caseQty = qty || '48';
      payload.packQty = qty || '48';
    }

    if (currentCatalog === 'institutional') {
      payload.caseSize = caseSize || '100 cups';
    }

    if (activeEditProductId) {
      window.AarnaStore.updateProduct(currentCatalog, activeEditProductId, payload);
      window.showToast?.('Product updated successfully', 'success') || alert('Product updated');
    } else {
      window.AarnaStore.addProduct(currentCatalog, payload);
      window.showToast?.('New product added to catalog', 'success') || alert('Product added');
    }

    closeAllModals();
    renderCatalogTable();
    initStats();
  }

  function setFormVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function closeAllModals() {
    document.querySelectorAll('.dash-modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  // --------------------------------------------------------------------------
  // CONTENT MANAGEMENT (Dynamic CMS)
  // --------------------------------------------------------------------------
  function initContentManager() {
    const contentForm = document.getElementById('dash-content-form');
    if (contentForm) {
      contentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveContentFromForm();
      });
    }

    document.getElementById('dash-reset-content-btn')?.addEventListener('click', () => {
      if (confirm('Reset all website text content back to factory defaults?')) {
        window.AarnaStore.resetContent();
        loadContentForm();
        window.showToast?.('Website content reset to default', 'info');
      }
    });
  }

  function loadContentForm() {
    const content = window.AarnaStore.getContent();
    for (let key in content) {
      const input = document.getElementById(`cms-${key}`);
      if (input) {
        input.value = content[key];
      }
    }
  }

  function saveContentFromForm() {
    const updated = {};
    document.querySelectorAll('[id^="cms-"]').forEach(input => {
      const key = input.id.replace('cms-', '');
      updated[key] = input.value;
    });

    window.AarnaStore.saveContent(updated);
    window.showToast?.('Website content updated dynamically!', 'success') || alert('Content updated');
  }

  // --------------------------------------------------------------------------
  // MEDIA & IMAGE MANAGER
  // --------------------------------------------------------------------------
  const MEDIA_SLOTS = [
    { key: 'about_pharmacy', title: 'About Us Section 1: Pharmacy Packaging Photo', current: 'assets/images/about-pharmacy-counter.png', cover: true },
    { key: 'card_institutional', title: 'Homepage Section 2: Institutional Products Card', current: 'assets/images/card-institutional.png', cover: true },
    { key: 'card_retail', title: 'Homepage Section 2: Retail Products Card', current: 'assets/images/card-retail.png', cover: true },
    { key: 'card_devices', title: 'Homepage Section 2: Medical Supplies Card', current: 'assets/images/card-medical-devices.png', cover: true },
    { key: 'private_label_img', title: 'Homepage Section 3: Private Label Packaging Photo', current: 'assets/images/private-label-blue-card.png', cover: true },
    { key: 'bottles_solid', title: 'About Us Showcase: Solid Dosage Bottles', current: 'assets/images/bottles-solid-dosage.png' },
    { key: 'cups_liquid', title: 'About Us Showcase: Unit-Dose Cups', current: 'assets/images/cups-liquid-dosage.png' },
    { key: 'hero_bg', title: 'Homepage Hero Banner Background', current: 'assets/images/hero-horizon.jpg', cover: true },
    { key: 'partner_cencora', title: 'Partner Card: Cencora', current: 'assets/logos/logo-cencora-ref.png' },
    { key: 'partner_cardinal', title: 'Partner Card: Cardinal Health', current: 'assets/logos/logo-cardinal-ref.png' },
    { key: 'partner_mckesson', title: 'Partner Card: McKesson', current: 'assets/logos/logo-mckesson-ref.png' },
    { key: 'partner_medline', title: 'Partner Card: Medline', current: 'assets/logos/logo-medline-ref.png' },
    { key: 'cat_pain', title: 'Catalog Category: Pain Reliever & Fever Reducer', current: 'assets/images/cat-pain-relief.png' },
    { key: 'cat_allergy', title: 'Catalog Category: Allergy Relief', current: 'assets/images/cat-allergy-relief.png' },
    { key: 'cat_cough', title: 'Catalog Category: Cough & Chest Congestion', current: 'assets/images/cat-cough-chest.png' },
    { key: 'cat_infants_gas', title: 'Catalog Category: Infants Gas Relief Drops', current: 'assets/images/cat-infants-gas.png' },
    { key: 'cat_constipation', title: 'Catalog Category: Constipation Relief', current: 'assets/images/cat-constipation.png' },
    { key: 'about_scientist', title: 'Research Specialist Avatar', current: 'assets/images/about-scientist.jpg', cover: true }
  ];

  function initMediaManager() {
    renderMediaGrid();

    // General file upload dropzone
    const dropzone = document.getElementById('dash-general-dropzone');
    const generalFileInput = document.getElementById('dash-general-file-input');

    if (dropzone && generalFileInput) {
      dropzone.addEventListener('click', () => generalFileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          handleUploadedFile(e.dataTransfer.files[0]);
        }
      });

      generalFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleUploadedFile(e.target.files[0]);
        }
      });
    }

    // Modal file upload for specific slot
    if (mediaFileInput) {
      mediaFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          processImageFile(e.target.files[0], (dataUrl) => {
            if (mediaPreviewImg) mediaPreviewImg.src = dataUrl;
          });
        }
      });
    }

    // Save image modal button
    document.getElementById('save-media-slot-btn')?.addEventListener('click', () => {
      if (activeMediaSlotKey && mediaPreviewImg && mediaPreviewImg.src) {
        window.AarnaStore.saveMedia(activeMediaSlotKey, mediaPreviewImg.src);
        window.showToast?.(`Image for "${activeMediaSlotKey}" updated!`, 'success') || alert('Image saved');
        closeAllModals();
        renderMediaGrid();
      }
    });
  }

  function renderMediaGrid() {
    const grid = document.getElementById('dash-media-grid');
    if (!grid) return;

    const countBadge = document.getElementById('dash-media-slots-count');
    if (countBadge) countBadge.textContent = `${MEDIA_SLOTS.length} active customizable visual slots`;

    const customMedia = window.AarnaStore.getAllMedia();

    let html = '';
    MEDIA_SLOTS.forEach(slot => {
      const activeImg = customMedia[slot.key] || slot.current;
      const isCustom = !!customMedia[slot.key];

      html += `
        <div class="dash-media-card">
          <div class="dash-media-preview-box ${slot.cover ? 'cover-mode' : ''}">
            <img src="${activeImg}" alt="${slot.title}">
            ${isCustom ? '<span style="position: absolute; top: 8px; right: 8px; background: #10b981; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">CUSTOM</span>' : ''}
          </div>
          <div class="dash-media-body">
            <div>
              <div class="dash-media-title">${slot.title}</div>
              <div class="dash-media-meta">Key: <code>${slot.key}</code></div>
            </div>
            <div class="dash-media-actions">
              <button class="dash-btn dash-btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;" onclick="window.openReplaceMediaModal('${slot.key}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Replace
              </button>
              ${isCustom ? `
                <button class="dash-btn dash-btn-danger" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;" onclick="window.resetMediaSlot('${slot.key}')" title="Reset to original">
                  Reset
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  window.openReplaceMediaModal = function(slotKey) {
    activeMediaSlotKey = slotKey;
    const slot = MEDIA_SLOTS.find(s => s.key === slotKey);
    if (!slot) return;

    if (mediaSlotNameEl) mediaSlotNameEl.textContent = slot.title;
    const currentSrc = window.AarnaStore.getMedia(slotKey) || slot.current;
    if (mediaPreviewImg) mediaPreviewImg.src = currentSrc;
    if (mediaFileInput) mediaFileInput.value = '';

    if (mediaModal) mediaModal.classList.add('open');
  };

  window.resetMediaSlot = function(slotKey) {
    if (confirm(`Reset this image back to the original website default?`)) {
      window.AarnaStore.deleteMedia(slotKey);
      renderMediaGrid();
      window.showToast?.('Image restored to default', 'info');
    }
  };

  function handleUploadedFile(file) {
    processImageFile(file, (dataUrl) => {
      // Prompt user which slot they want to assign it to
      let opts = MEDIA_SLOTS.map((s, idx) => `${idx + 1}. ${s.title}`).join('\n');
      let choice = prompt(`Select slot number to assign this image (1-${MEDIA_SLOTS.length}):\n\n${opts}`);
      let num = parseInt(choice, 10);
      if (num >= 1 && num <= MEDIA_SLOTS.length) {
        const selectedSlot = MEDIA_SLOTS[num - 1];
        window.AarnaStore.saveMedia(selectedSlot.key, dataUrl);
        renderMediaGrid();
        window.showToast?.(`Image assigned to "${selectedSlot.title}"!`, 'success') || alert('Assigned!');
      }
    });
  }

  // Optimize and resize image using Canvas to avoid huge localStorage footprints
  function processImageFile(file, callback) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const compressedDataUrl = canvas.toDataURL('image/webp', 0.82);
        callback(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --------------------------------------------------------------------------
  // INQUIRIES & LEADS MANAGER
  // --------------------------------------------------------------------------
  function initInquiriesManager() {
    renderInquiries();

    document.getElementById('dash-export-inquiries-csv')?.addEventListener('click', () => {
      exportInquiriesCSV();
    });

    document.getElementById('dash-clear-inquiries-btn')?.addEventListener('click', () => {
      if (confirm('Clear all stored inquiries? This cannot be undone.')) {
        window.AarnaStore.clearAllInquiries();
        renderInquiries();
        initStats();
      }
    });
  }

  function renderInquiries() {
    const container = document.getElementById('dash-inquiries-list');
    if (!container) return;

    const list = window.AarnaStore.getInquiries();

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; color: #64748b;">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 0.75rem; display: block; color: #cbd5e1;">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <strong style="display: block; font-size: 1.1rem; color: #0f172a; margin-bottom: 0.35rem;">No customer inquiries yet</strong>
          <span>Messages submitted via the public Contact Us form will appear here in real-time.</span>
        </div>
      `;
      return;
    }

    let html = '';
    list.forEach(inq => {
      const isUnread = inq.status === 'unread';
      const dateStr = inq.date ? new Date(inq.date).toLocaleString() : 'Recent';

      html += `
        <div class="dash-inquiry-card ${isUnread ? 'unread' : ''}">
          <div class="dash-inquiry-top">
            <div class="dash-inquiry-sender">
              ${inq.firstName || ''} ${inq.lastName || ''}
              ${isUnread ? '<span style="background: #ef4444; color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 9999px; margin-left: 6px;">NEW</span>' : ''}
            </div>
            <div class="dash-inquiry-date">${dateStr}</div>
          </div>

          <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; display: flex; gap: 1.25rem; flex-wrap: wrap;">
            <span><strong>Email:</strong> <a href="mailto:${inq.email}" style="color: #1d63ff;">${inq.email}</a></span>
            ${inq.phone ? `<span><strong>Phone:</strong> <a href="tel:${inq.phone}" style="color: #0f172a;">${inq.phone}</a></span>` : ''}
            ${inq.product ? `<span><strong>Referenced Product:</strong> ${inq.product} (${inq.ndc || ''})</span>` : ''}
          </div>

          <div class="dash-inquiry-msg">${escapeHtml(inq.message || '')}</div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            ${isUnread ? `
              <button class="dash-btn dash-btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;" onclick="window.markInquiryStatus('${inq.id}', 'read')">
                Mark as Read
              </button>
            ` : `
              <button class="dash-btn dash-btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;" onclick="window.markInquiryStatus('${inq.id}', 'unread')">
                Mark as Unread
              </button>
            `}
            <button class="dash-btn dash-btn-danger" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;" onclick="window.deleteInquiryItem('${inq.id}')">
              Delete
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.markInquiryStatus = function(id, status) {
    window.AarnaStore.updateInquiryStatus(id, status);
    renderInquiries();
    initStats();
  };

  window.deleteInquiryItem = function(id) {
    if (confirm('Delete this inquiry?')) {
      window.AarnaStore.deleteInquiry(id);
      renderInquiries();
      initStats();
    }
  };

  function exportInquiriesCSV() {
    const list = window.AarnaStore.getInquiries();
    if (list.length === 0) {
      alert('No inquiries to export.');
      return;
    }

    let csv = 'ID,Date,Name,Email,Phone,Product,NDC,Message,Status\n';
    list.forEach(inq => {
      const row = [
        inq.id,
        inq.date,
        `"${(inq.firstName || '') + ' ' + (inq.lastName || '')}"`,
        `"${inq.email || ''}"`,
        `"${inq.phone || ''}"`,
        `"${inq.product || ''}"`,
        `"${inq.ndc || ''}"`,
        `"${(inq.message || '').replace(/"/g, '""')}"`,
        inq.status || 'unread'
      ];
      csv += row.join(',') + '\n';
    });

    downloadFile(csv, 'AARNA_Inquiries.csv', 'text/csv');
  }

  // --------------------------------------------------------------------------
  // BACKUP & SETTINGS
  // --------------------------------------------------------------------------
  function initBackupManager() {
    document.getElementById('dash-export-backup-btn')?.addEventListener('click', () => {
      const json = window.AarnaStore.exportFullBackup();
      downloadFile(json, `AARNA_Backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      window.showToast?.('Complete backup downloaded successfully', 'success');
    });

    const importInput = document.getElementById('dash-import-file-input');
    document.getElementById('dash-import-backup-btn')?.addEventListener('click', () => {
      importInput?.click();
    });

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
            const res = window.AarnaStore.importFullBackup(ev.target.result);
            if (res.success) {
              alert('Backup imported successfully! All products, content, and media have been updated.');
              location.reload();
            } else {
              alert('Failed to import backup: ' + res.error);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    document.getElementById('dash-factory-reset-btn')?.addEventListener('click', () => {
      const code = prompt('Type RESET to confirm factory reset. This will restore original PDF catalogs and content:');
      if (code === 'RESET') {
        window.AarnaStore.resetAllToDefaults();
        alert('All data restored to factory defaults!');
        location.reload();
      }
    });
  }

  // --------------------------------------------------------------------------
  // MOBILE SIDEBAR
  // --------------------------------------------------------------------------
  function initMobileSidebar() {
    const toggle = document.querySelector('.dash-mobile-toggle');
    const sidebar = document.querySelector('.dash-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  // Utility helpers
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

})();
