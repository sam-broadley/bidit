/* bidit-script.js – standalone ES2020 */
/* global window, document */

(() => {
  'use strict';

  /* ------------------------------------------------------------ *
   * CONFIGURABLES
   * ------------------------------------------------------------ */
  const themeCfg = window.BidItConfig || {};
  const defaults = {
    modalUrl: 'https://bidit-tau.vercel.app',
    productId: '',
    variantId: '',
    productTitle: '',
    productPrice: 0,
    userId: '',
    buttonSelector: '[data-bidit-button]',
    modalStyle: 'dropdown',   // or 'fullscreen'
    borderRadius: '20px',
    modalContainer: 'body'    // container selector for modal
  };
  const settings = { ...defaults, ...themeCfg };

  /* ------------------------------------------------------------ *
   * RESPONSIVE DIMENSIONS
   * ------------------------------------------------------------ */
  function getModalDims() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw <= 767) {
      return {
        w: `${Math.min(vw - 40, 420)}px`,
        h: `${Math.min(vh - 40, 520)}px`
      };
    }
    if (vw <= 1199) {
      return { w: '450px', h: '600px' };
    }
    return { w: '510px', h: '680px' };
  }

  /* ------------------------------------------------------------ *
   * VARIANT + PRICE HELPERS
   * ------------------------------------------------------------ */
  function getCurrentVariantInfo() {
    let currentVariantId = settings.variantId;
    let currentPrice = settings.productPrice;

    // URL parameter
    const urlVariant = new URLSearchParams(location.search).get('variant');
    if (urlVariant) currentVariantId = urlVariant;

    // Common selectors / inputs
    if (!urlVariant) {
      const sel = document.querySelector(
        'select[name="id"], select[data-variant-select], .single-option-selector'
      );
      const inp = document.querySelector(
        'input[name="id"]:checked, input[data-variant-id]'
      );
      if (sel?.value) currentVariantId = sel.value;
      else if (inp?.value) currentVariantId = inp.value;
    }

    // Price element – only run when we’re on a product page
    if (settings.productId) {
      const priceEl = document.querySelector('.price, .product-price, [data-price]');
      if (priceEl) {
        const raw = priceEl.textContent || priceEl.getAttribute('data-price') || '';
        const m   = raw.match(/[\d,]+\.?\d*/);
        if (m) currentPrice = parseFloat(m[0].replace(/,/g, ''));
      }
    }

    return { currentVariantId, currentPrice };
  }

  /* ------------------------------------------------------------ *
   * MODAL
   * ------------------------------------------------------------ */
  function createModal(triggerBtn) {
    const iframe = document.createElement('iframe');
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();
    const qs = [
      `productId=${encodeURIComponent(settings.productId)}`,
      `variantId=${encodeURIComponent(currentVariantId || '')}`,
      `title=${encodeURIComponent(settings.productTitle)}`,
      `price=${currentPrice}`,
      `userId=${encodeURIComponent(settings.userId)}`
    ].join('&');
    iframe.src = `${settings.modalUrl}/modal?${qs}`;
    iframe.id  = 'bidit-modal-iframe';

    // Check if we're in cart mode (productId is null/empty and we're in a container)
    const isCartMode = !settings.productId && settings.modalContainer !== 'body';
    
    if (isCartMode) {
      /* cart mode - smaller, inline styling */
      iframe.style.cssText = `
        position:relative;width:100%;height:600px;border:none;
        border-radius:12px;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.1);
        margin-top:16px;
      `;
    } else if (settings.modalStyle === 'dropdown' && triggerBtn) {
      /* dropdown positioning */
      const { w, h }   = getModalDims();
      const btnRect    = triggerBtn.getBoundingClientRect();
      const vw         = window.innerWidth;
      const vh         = window.innerHeight;
      let   left       = btnRect.left;
      let   top        = btnRect.bottom + 10;
      const pxW        = parseInt(w, 10);
      const pxH        = parseInt(h, 10);

      if (left + pxW > vw) left = vw - pxW - 20;
      if (left < 20)       left = 20;
      if (top + pxH > vh)  top  = Math.max(btnRect.top - pxH - 10, 20);

      iframe.style.cssText = `
        position:fixed;top:${top}px;left:${left}px;width:${w};height:${h};
        border:none;border-radius:${settings.borderRadius};
        z-index:999999;box-shadow:0 10px 40px rgba(0,0,0,.3);background:#fff;
      `;
    } else {
      /* fullscreen fallback */
      iframe.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        border:none;z-index:999999;background:rgba(0,0,0,.5);
      `;
    }

    /* close handler */
    window.addEventListener('message', (ev) => {
      if (ev.origin === settings.modalUrl && ev.data?.type === 'BIDIT_CLOSE') {
        closeModal();
      }
    });

    return iframe;
  }

  function openModal(btn) {
    if (document.getElementById('bidit-modal-iframe')) return; // already open
    
    // Check if we're in cart mode
    const isCartMode = !settings.productId && settings.modalContainer !== 'body';
    
    // Get the container element
    const containerSelector = settings.modalContainer;
    const modalRoot = document.querySelector(containerSelector);
    
    if (!modalRoot) {
      console.warn(`BidIt: Container selector "${containerSelector}" not found, falling back to body`);
      document.body.appendChild(createModal(btn));
    } else {
      modalRoot.appendChild(createModal(btn));
    }
    
    // Only hide body overflow for fullscreen mode, not cart mode
    if (settings.modalStyle === 'fullscreen' && !isCartMode) {
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    const ifr = document.getElementById('bidit-modal-iframe');
    if (ifr) ifr.remove();
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------ *
   * BUTTON STYLING / INJECTION
   * ------------------------------------------------------------ */
  function styleBidItBtn(btn) {
    btn.innerHTML = `
      <span style="font-weight:500;font-size:15px;">Make an offer with</span>
      <img src="https://res.cloudinary.com/stitchify/image/upload/v1752903381/qxofvucv6vaumewupadp.png" 
           alt="BidIt" style="height:15px;width:auto;" />
    `;
    btn.style.cssText = `
      background:#F85711!important;color:#fff!important;border:#99999960 1px solid!important;
      padding:12px 24px!important;border-radius:0!important;font-weight:600!important;
      margin-top:10px!important;width:100%!important;display:flex!important;gap:4.5px!important;
      align-items:center!important;justify-content:center!important;cursor:pointer!important;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif!important;
      transition:transform .2s, box-shadow .2s!important;min-height:48px!important;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(240,120,60,.4)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 2px 8px rgba(240,120,60,.3)';
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(btn);
    });
  }

  function autoInjectBtn() {
    const form = document.querySelector('form[action*="/cart/add"]');
    if (!form) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    styleBidItBtn(btn);
    form.appendChild(btn);
  }

  /* ------------------------------------------------------------ *
   * VARIANT CHANGE LISTENERS
   * ------------------------------------------------------------ */
  function refreshIframeSrc() {
    const iframe = document.getElementById('bidit-modal-iframe');
    if (!iframe) return;
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();
    const newSrc =
      `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}` +
      `&variantId=${encodeURIComponent(currentVariantId || '')}` +
      `&title=${encodeURIComponent(settings.productTitle)}` +
      `&price=${currentPrice}` +
      `&userId=${encodeURIComponent(settings.userId)}`;
    iframe.src = newSrc;
  }

  function setupVariantListeners() {
    const selectors = [
      'select[name="id"]',
      'select[data-variant-select]',
      '.single-option-selector',
      'input[name="id"]',
      'input[data-variant-id]',
      '[data-variant-selector]'
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.addEventListener('change', refreshIframeSrc);
      });
    });
    document.addEventListener('variant:change', refreshIframeSrc);

    /* Detect URL param changes */
    let lastURL = location.href;
    setInterval(() => {
      if (location.href !== lastURL) {
        lastURL = location.href;
        refreshIframeSrc();
      }
    }, 500);
  }

  /* ------------------------------------------------------------ *
   * INIT
   * ------------------------------------------------------------ */
  function init() {
    // Check for data-modal-container attribute on the script tag
    const scriptTag = document.currentScript || document.querySelector('script[src*="bidit-script.js"]');
    if (scriptTag) {
      const containerSelector = scriptTag.getAttribute('data-modal-container');
      if (containerSelector) {
        settings.modalContainer = containerSelector;
      }
    }
    
    const btns = document.querySelectorAll(settings.buttonSelector);
    btns.forEach(styleBidItBtn);
    if (btns.length === 0) autoInjectBtn();
    setupVariantListeners();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* global helper */
  window.BidIt = { open: openModal, close: closeModal, init };
})(); 