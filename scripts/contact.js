// Inquiry Type Toggle Interaction (Product Inquiry, Wholesale / Distribution, Private-label OTC)
(function() {
  'use strict';

  const toggleProduct = document.getElementById('toggle-product');
  const toggleWholesale = document.getElementById('toggle-wholesale');
  const togglePrivate = document.getElementById('toggle-private-label');
  const inquiryInput = document.getElementById('inquiryTypeInput');
  const helperText = document.getElementById('inquiryHelperText');

  if (!toggleProduct || !togglePrivate) return;

  const checkSvg = `
    <span class="toggle-check-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </span>
  `;

  const tabs = [
    { key: 'product', el: toggleProduct, value: 'Product inquiry', text: '<span>Product inquiry</span>', helper: 'Tell us what you need. Product availability, packaging formats, and details will be confirmed by our team.' },
    { key: 'wholesale', el: toggleWholesale, value: 'Wholesale / Distribution', text: '<span>Wholesale / Distribution</span>', helper: 'Tell us about your business type, territories or markets served, products of interest, and anticipated order volume.' },
    { key: 'private', el: togglePrivate, value: 'Private-label OTC', text: '<span>Private-label OTC</span>', helper: 'Tell us about your brand goals, preferred dosages (liquids, tablets, creams), packaging options, and estimated volume.' }
  ];

  function selectTab(typeKey) {
    tabs.forEach(tab => {
      if (!tab.el) return;
      if (tab.key === typeKey) {
        tab.el.classList.add('active');
        tab.el.setAttribute('aria-selected', 'true');
        tab.el.innerHTML = checkSvg + tab.text;
        if (inquiryInput) inquiryInput.value = tab.value;
        if (helperText) helperText.textContent = tab.helper;
      } else {
        tab.el.classList.remove('active');
        tab.el.setAttribute('aria-selected', 'false');
        tab.el.innerHTML = tab.text;
      }
    });
  }

  if (toggleProduct) toggleProduct.addEventListener('click', () => selectTab('product'));
  if (toggleWholesale) toggleWholesale.addEventListener('click', () => selectTab('wholesale'));
  if (togglePrivate) togglePrivate.addEventListener('click', () => selectTab('private'));

  // Check URL params for subject or pre-selection (e.g. ?inquiry=wholesale or ?subject=wholesale)
  const urlParams = new URLSearchParams(window.location.search);
  const inquiryParam = (urlParams.get('inquiry') || urlParams.get('subject') || '').toLowerCase();

  if (inquiryParam.includes('wholesale') || inquiryParam.includes('distribution')) {
    selectTab('wholesale');
  } else if (inquiryParam.includes('private')) {
    selectTab('private');
  } else {
    selectTab('product');
  }
})();
