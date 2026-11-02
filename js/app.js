/**
 * AARNA Pharmaceuticals & Healthcare Web Application
 * Core Client Logic & Interactive UI Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initToastSystem();
  initCatalogTable();
  initCatalogDownload();
  initContactForm();
  initProductModal();
  initShowcaseTabs();
  initProductShowcaseCards();
});

/* ==========================================================================
   NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
  const dropdownMenu = document.querySelector('.nav-dropdown-menu');

  // Sticky header scroll behavior
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Mobile drawer toggle
  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close when clicking outside drawer content
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        closeDrawer();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  function openDrawer() {
    drawer.classList.add('open');
    toggleBtn.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    toggleBtn.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // Keyboard accessibility for desktop dropdown
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }

  // Active navigation highlight based on current pathname
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .mobile-drawer-link, .dropdown-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
      link.classList.add('active');
      // If inside dropdown, highlight parent
      const parentDropdown = link.closest('.nav-dropdown-item');
      if (parentDropdown) {
        const trigger = parentDropdown.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.classList.add('active');
      }
    }
  });
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE (Sonner-style)
   ========================================================================== */
let toastStack;

function initToastSystem() {
  toastStack = document.querySelector('.toast-stack');
  if (!toastStack) {
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    toastStack.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastStack);
  }
}

window.showToast = function(message, type = 'info') {
  if (!toastStack) initToastSystem();

  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;

  const iconSvg = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  toastStack.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 250ms ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3200);
};

/* ==========================================================================
   INTERACTIVE CATALOG TABLE & FILTERING
   ========================================================================== */
function initCatalogTable() {
  const tableEl = document.querySelector('.product-table');
  const searchInput = document.querySelector('.catalog-search-input');
  const clearSearchBtn = document.querySelector('.catalog-search-clear');
  const filterPills = document.querySelectorAll('.filter-pill');
  const counterEl = document.querySelector('.table-results-count');
  
  if (!tableEl) return;

  const datasetType = tableEl.dataset.catalog; // 'retail', 'devices', or 'institutional'
  
  // Use dynamic AarnaStore if available (supports dashboard edits/additions), fallback to static AARNA_DATA
  const allItems = (window.AarnaStore && window.AarnaStore.getProducts) 
    ? window.AarnaStore.getProducts(datasetType) 
    : (window.AARNA_DATA && window.AARNA_DATA[datasetType] ? window.AARNA_DATA[datasetType] : []);

  if (!allItems || allItems.length === 0) {
    console.warn('Dataset not found for catalog:', datasetType);
    return;
  }
  let activeCategory = 'All';
  let searchQuery = '';

  // Render Table Rows
  function renderRows(filteredItems) {
    const tbody = tableEl.querySelector('tbody');
    if (!tbody) return;

    if (filteredItems.length === 0) {
      const colSpan = tableEl.querySelectorAll('thead th').length || 4;
      tbody.innerHTML = `
        <tr>
          <td colspan="${colSpan}">
            <div class="table-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3>No matching products found</h3>
              <p>Try refining your search keyword or selecting a different category.</p>
            </div>
          </td>
        </tr>
      `;
      if (counterEl) counterEl.textContent = `Showing 0 of ${allItems.length} products`;
      return;
    }

    let html = '';
    filteredItems.forEach(item => {
      if (datasetType === 'retail') {
        html += `
          <tr class="product-row" data-id="${item.id}" data-catalog="retail">
            <td class="cell-desc" data-label="Product">
              <div class="product-cell-main">
                <span class="product-title-text">${item.description}</span>
                <span class="product-category-sub">${item.category || 'Retail OTC'}</span>
              </div>
            </td>
            <td data-label="Unit">${item.unit || 'EA'}</td>
            <td data-label="Case Qty.">${item.caseQty || '—'}</td>
            <td data-label="NDC">
              <span class="cell-badge copy-ndc" title="Click to copy NDC" data-ndc="${item.ndc}">
                ${item.ndc}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </span>
            </td>
          </tr>
        `;
      } else if (datasetType === 'devices') {
        html += `
          <tr class="product-row" data-id="${item.id}" data-catalog="devices">
            <td class="cell-desc" data-label="Product">
              <div class="product-cell-main">
                <span class="product-title-text">${item.description}</span>
                <span class="product-category-sub">${item.category || 'Medical Supplies'}</span>
              </div>
            </td>
            <td data-label="Unit">${item.unit || 'BOX'}</td>
            <td data-label="Pack Qty.">${item.packQty || '100'}</td>
            <td data-label="NDC">
              <span class="cell-badge copy-ndc" title="Click to copy NDC" data-ndc="${item.ndc}">
                ${item.ndc}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </span>
            </td>
          </tr>
        `;
      } else if (datasetType === 'institutional') {
        html += `
          <tr class="product-row" data-id="${item.id}" data-catalog="institutional">
            <td class="cell-desc" data-label="Product">
              <div class="product-cell-main">
                <span class="product-title-text">${item.description}</span>
                <span class="product-category-sub">${item.category || 'Institutional unit-dose format'}</span>
              </div>
            </td>
            <td data-label="Unit">${item.unit || 'EA'}</td>
            <td data-label="Pack Qty.">${item.packQty || '1'}</td>
            <td data-label="NDC">
              <span class="cell-badge copy-ndc" title="Click to copy NDC" data-ndc="${item.ndc}">
                ${item.ndc}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </span>
            </td>
            <td data-label="Case Size">${item.caseSize || '—'}</td>
          </tr>
        `;
      }
    });

    tbody.innerHTML = html;
    if (counterEl) {
      counterEl.textContent = `Showing ${filteredItems.length} of ${allItems.length} products`;
    }

    // Attach row click to open product modal
    tbody.querySelectorAll('.product-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // If clicked on copy-ndc, don't trigger modal
        if (e.target.closest('.copy-ndc')) return;
        const itemId = row.dataset.id;
        const itemObj = allItems.find(it => it.id === itemId);
        if (itemObj) {
          openProductModal(itemObj, datasetType);
        }
      });
    });

    // Attach copy-ndc handlers
    tbody.querySelectorAll('.copy-ndc').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const ndc = badge.dataset.ndc;
        if (ndc) {
          navigator.clipboard.writeText(ndc).then(() => {
            window.showToast(`NDC ${ndc} copied to clipboard`, 'success');
          }).catch(() => {
            window.showToast(`NDC: ${ndc}`, 'info');
          });
        }
      });
    });
  }

  // Filter Logic
  function applyFilters() {
    const q = searchQuery.toLowerCase().trim();
    const filtered = allItems.filter(item => {
      // Category match
      let catMatch = true;
      if (activeCategory !== 'All' && activeCategory !== 'All Products') {
        catMatch = (item.category && item.category.toLowerCase().includes(activeCategory.toLowerCase()));
      }

      // Query match (description, NDC, category)
      let textMatch = true;
      if (q) {
        const desc = (item.description || '').toLowerCase();
        const ndc = (item.ndc || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        textMatch = desc.includes(q) || ndc.includes(q) || cat.includes(q);
      }

      return catMatch && textMatch;
    });

    renderRows(filtered);
  }

  // Setup search input listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('visible', searchQuery.length > 0);
      }
      applyFilters();
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.focus();
        applyFilters();
      });
    }
  }

  // Setup filter pills
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      activeCategory = pill.dataset.category || 'All';
      applyFilters();
    });
  });

  // Check URL Search Params for deep linking (e.g. category cards on Home page)
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category');
  const initialSearch = urlParams.get('q') || urlParams.get('search');

  if (initialSearch && searchInput) {
    searchInput.value = initialSearch;
    searchQuery = initialSearch;
    if (clearSearchBtn) clearSearchBtn.classList.add('visible');
  }

  if (initialCategory) {
    const matchingPill = Array.from(filterPills).find(p => 
      (p.dataset.category || '').toLowerCase() === initialCategory.toLowerCase() ||
      (p.textContent || '').trim().toLowerCase() === initialCategory.toLowerCase()
    );
    if (matchingPill) {
      filterPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      matchingPill.classList.add('active');
      matchingPill.setAttribute('aria-selected', 'true');
      activeCategory = matchingPill.dataset.category || initialCategory;
    } else {
      activeCategory = initialCategory;
    }
  }

  // Initial render (honors URL parameters if present)
  applyFilters();
}

/* ==========================================================================
   PRODUCT DETAIL MODAL
   ========================================================================== */
function initProductModal() {
  let modalOverlay = document.querySelector('.modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-prod-title">
        <button class="modal-close-btn" aria-label="Close dialog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="modal-content-area"></div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    const closeBtn = modalOverlay.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
        closeModal();
      }
    });
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.closeProductModal = closeModal;

  window.openProductModal = function(item, type) {
    const contentArea = modalOverlay.querySelector('.modal-content-area');
    if (!contentArea) return;

    let metaDetails = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; background-color: var(--color-bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
        <div>
          <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; display: block; margin-bottom: 0.2rem;">Unit</span>
          <strong style="color: var(--color-primary); font-size: 1.05rem;">${item.unit || 'EA'}</strong>
        </div>
        <div>
          <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; display: block; margin-bottom: 0.2rem;">${type === 'retail' ? 'Case Quantity' : 'Pack Quantity'}</span>
          <strong style="color: var(--color-primary); font-size: 1.05rem;">${item.caseQty || item.packQty || 'Standard'}</strong>
        </div>
        <div>
          <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; display: block; margin-bottom: 0.2rem;">NDC Code</span>
          <span style="font-family: monospace; font-size: 1rem; font-weight: 700; color: var(--color-accent-blue);">${item.ndc}</span>
        </div>
        <div>
          <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; display: block; margin-bottom: 0.2rem;">Therapeutic Category</span>
          <strong style="color: var(--color-primary); font-size: 0.95rem;">${item.category || 'General Care'}</strong>
        </div>
        ${item.caseSize ? `
        <div style="grid-column: span 2;">
          <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600; display: block; margin-bottom: 0.2rem;">Institutional Case Size</span>
          <strong style="color: var(--color-primary); font-size: 1rem;">${item.caseSize}</strong>
        </div>` : ''}
      </div>
    `;

    contentArea.innerHTML = `
      <div class="badge-tag">Product Specification</div>
      <h2 id="modal-prod-title" style="font-size: 1.5rem; margin-bottom: 0.5rem; line-height: 1.25;">${item.description}</h2>
      <p style="color: var(--color-text-muted); font-size: 0.95rem;">Manufactured for AARNA USA Inc. • High-quality pharmaceutical standards & NDC barcoded.</p>
      
      ${metaDetails}

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem;">
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${item.ndc}').then(() => window.showToast('NDC copied to clipboard', 'success'))">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy NDC Code
        </button>
        <a href="contact.html?product=${encodeURIComponent(item.description)}&ndc=${encodeURIComponent(item.ndc)}" class="btn btn-primary">
          Inquire About This Product
          <span class="btn-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </a>
      </div>
    `;

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
}

/* ==========================================================================
   CATALOG VIEWER & DOWNLOAD LOGIC (Interactive PDF Preview & Download)
   ========================================================================== */
function initCatalogDownload() {
  const pdfUrl = 'assets/downloads/Aarna_USA_Product_Catalog.pdf';
  const pdfFilename = 'Aarna_USA_Product_Catalog.pdf';

  // Global direct download trigger
  window.downloadCatalogPDF = function() {
    const tempLink = document.createElement('a');
    tempLink.href = pdfUrl;
    tempLink.download = pdfFilename;
    tempLink.target = '_blank';
    document.body.appendChild(tempLink);
    tempLink.click();
    tempLink.remove();
    if (typeof window.showToast === 'function') {
      window.showToast('Catalog PDF download started!', 'success');
    }
  };

  // Create or retrieve the PDF Preview Modal
  let catalogOverlay = document.getElementById('catalog-viewer-modal');
  if (!catalogOverlay) {
    catalogOverlay = document.createElement('div');
    catalogOverlay.id = 'catalog-viewer-modal';
    catalogOverlay.className = 'catalog-viewer-overlay';
    catalogOverlay.setAttribute('role', 'dialog');
    catalogOverlay.setAttribute('aria-modal', 'true');
    catalogOverlay.setAttribute('aria-label', 'AARNA USA Full Product Catalog Preview');

    catalogOverlay.innerHTML = `
      <div class="catalog-viewer-dialog">
        <div class="catalog-viewer-header">
          <div class="catalog-viewer-info">
            <div class="catalog-viewer-title-row">
              <svg class="catalog-pdf-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h2 class="catalog-viewer-title">AARNA USA — Full Product Catalog</h2>
              <span class="catalog-viewer-badge">Official 2026 Catalog • PDF</span>
            </div>
            <p class="catalog-viewer-subtitle">Scroll through all pages below or click download for an offline copy.</p>
          </div>

          <div class="catalog-viewer-actions">
            <button class="btn-catalog-action btn-catalog-download" id="modal-catalog-dl-action" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download PDF</span>
            </button>
            <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-catalog-action btn-catalog-tab" title="Open full screen in a new tab">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>Open in New Tab</span>
            </a>
            <button class="catalog-viewer-close-btn" id="modal-catalog-close-action" aria-label="Close catalog preview">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="catalog-viewer-body">
          <iframe 
            id="catalog-pdf-frame" 
            src="" 
            title="AARNA USA Full Product Catalog PDF"
            class="catalog-pdf-iframe"
          ></iframe>
          <div class="catalog-pdf-fallback" id="catalog-pdf-fallback-box">
            <p>Your browser could not preview the PDF inline.</p>
            <div style="display: flex; gap: 0.75rem; margin-top: 1rem; justify-content: center;">
              <button class="btn btn-primary" onclick="window.downloadCatalogPDF()">Download Catalog PDF</button>
              <a href="${pdfUrl}" target="_blank" class="btn btn-secondary">Open in New Tab</a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(catalogOverlay);

    // Event: Download action button inside modal
    const dlBtn = catalogOverlay.querySelector('#modal-catalog-dl-action');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => window.downloadCatalogPDF());
    }

    // Event: Close modal button
    const closeBtn = catalogOverlay.querySelector('#modal-catalog-close-action');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCatalogViewer);
    }

    // Event: Click backdrop to close
    catalogOverlay.addEventListener('click', (e) => {
      if (e.target === catalogOverlay) {
        closeCatalogViewer();
      }
    });

    // Event: Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && catalogOverlay.classList.contains('open')) {
        closeCatalogViewer();
      }
    });
  }

  function closeCatalogViewer() {
    if (!catalogOverlay) return;
    catalogOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.closeCatalogViewer = closeCatalogViewer;

  window.openCatalogViewer = function() {
    if (!catalogOverlay) return;
    const iframe = catalogOverlay.querySelector('#catalog-pdf-frame');
    if (iframe && (!iframe.src || iframe.src === '' || iframe.src === window.location.href)) {
      // Lazy-load the PDF src only when opened
      iframe.src = `${pdfUrl}#toolbar=1&navpanes=1&view=FitH`;
    }
    catalogOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Attach to all catalog buttons and links across the site
  const catalogTriggers = document.querySelectorAll('.trigger-catalog-download, .view-catalog-link, [data-action="open-catalog"]');
  catalogTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openCatalogViewer();
    });
  });
}

/* ==========================================================================
   CONTACT FORM LOGIC
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('aarna-contact-form');
  if (!contactForm) return;

  // Pre-fill message if product passed in URL query
  const urlParams = new URLSearchParams(window.location.search);
  const prodParam = urlParams.get('product');
  const ndcParam = urlParams.get('ndc');
  if (prodParam) {
    const msgInput = document.getElementById('message');
    if (msgInput) {
      msgInput.value = `Hello AARNA Team,\n\nI am requesting information, availability, and pricing for:\nProduct: ${prodParam}\nNDC: ${ndcParam || 'N/A'}\n\nPlease contact me with details.`;
    }
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const message = document.getElementById('message')?.value.trim();

    if (!firstName || !email || !message) {
      window.showToast('Please fill in all required fields (*)', 'info');
      return;
    }

    // Save to dynamic AarnaStore inquiries for the Admin Dashboard
    if (window.AarnaStore && window.AarnaStore.addInquiry) {
      window.AarnaStore.addInquiry({
        firstName,
        lastName,
        phone,
        email,
        message,
        product: prodParam,
        ndc: ndcParam
      });
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
      Sending...
    `;

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      contactForm.reset();
      window.showToast('Thank you! Your message has been sent and recorded in the portal.', 'success');
    }, 900);
  });
}

/* ==========================================================================
   PRODUCT SHOWCASE TABS FILTER
   ========================================================================== */
function initShowcaseTabs() {
  const tabs = document.querySelectorAll('.showcase-tab-btn');
  const cards = document.querySelectorAll('.modern-prod-card');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      cards.forEach((card, idx) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        setTimeout(() => {
          card.style.transition = 'all 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, idx * 60);
      });
    });
  });
}

/* ==========================================================================
   PRODUCT SHOWCASE CARDS NAVIGATION
   ========================================================================== */
function initProductShowcaseCards() {
  const cards = document.querySelectorAll('.modern-prod-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking directly on an anchor or button inside, let standard event proceed
      if (e.target.closest('a') || e.target.closest('button')) return;
      const targetLink = card.querySelector('a.modern-arrow-btn') || card.querySelector('a');
      if (targetLink && targetLink.href) {
        window.location.href = targetLink.href;
      }
    });
  });
}
