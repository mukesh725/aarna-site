// Inquiry Type Toggle Interaction
(function() {
  'use strict';

  const toggleProduct = document.getElementById('toggle-product');
  const togglePrivate = document.getElementById('toggle-private-label');
  const inquiryInput = document.getElementById('inquiryTypeInput');
  const helperText = document.getElementById('inquiryHelperText');

  if (!toggleProduct || !togglePrivate) return;

  const checkSvg = `
    <span class="toggle-check-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </span>
  `;

  function selectTab(type) {
    if (type === 'private') {
      togglePrivate.classList.add('active');
      togglePrivate.setAttribute('aria-selected', 'true');
      togglePrivate.innerHTML = checkSvg + '<span>Private-label OTC</span>';

      toggleProduct.classList.remove('active');
      toggleProduct.setAttribute('aria-selected', 'false');
      toggleProduct.innerHTML = '<span>Product inquiry</span>';

      if (inquiryInput) inquiryInput.value = 'Private-label OTC';
      if (helperText) {
        helperText.textContent = 'Tell us about your brand goals, preferred dosages (liquids, tablets, creams), and packaging requirements.';
      }
    } else {
      toggleProduct.classList.add('active');
      toggleProduct.setAttribute('aria-selected', 'true');
      toggleProduct.innerHTML = checkSvg + '<span>Product inquiry</span>';

      togglePrivate.classList.remove('active');
      togglePrivate.setAttribute('aria-selected', 'false');
      togglePrivate.innerHTML = '<span>Private-label OTC</span>';

      if (inquiryInput) inquiryInput.value = 'Product inquiry';
      if (helperText) {
        helperText.textContent = 'Tell us what you need. Product availability and details will be confirmed by our team.';
      }
    }
  }

  toggleProduct.addEventListener('click', () => selectTab('product'));
  togglePrivate.addEventListener('click', () => selectTab('private'));

  // Check URL params for subject or pre-selection
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  if (subject && subject.toLowerCase().includes('private')) {
    selectTab('private');
  }
})();
