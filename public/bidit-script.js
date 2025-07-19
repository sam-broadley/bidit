<script>
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * CONFIG
   * ------------------------------------------------------------------ */
  const themeCfg = window.BidItConfig || {};
  const defaults = {
    modalUrl: 'https://bidit-tau.vercel.app',
    productId: '',
    variantId: '',
    productTitle: '',
    productPrice: 0,
    userId: '',
    buttonSelector: '[data-bidit-button]',
    modalStyle: 'dropdown',
    borderRadius: '20px'
  };
  const settings = { ...defaults, ...themeCfg };

  /* ------------------------------------------------------------------ *
   * UTIL – RESPONSIVE MODAL DIMS
   * ------------------------------------------------------------------ */
  function getModalDims() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw <= 767) {                 // phones
      return {
        w: Math.min(vw - 40, 420) + 'px',
        h: Math.min(vh - 40, 520) + 'px'
      };
    }

    if (vw <= 1199) {                // tablets / small desktop
      return { w: '450px', h: '600px' };
    }

    return { w: '550px', h: '680px' }; // large desktop
  }

  /* ------------------------------------------------------------------ *
   * GET VARIANT + PRICE
   * ------------------------------------------------------------------ */
  function getCurrentVariantInfo() {
    let currentVariantId = settings.variantId;
    let currentPrice = settings.productPrice;

    // 1. URL param
    const urlVariant = new URLSearchParams(window.location.search).get('variant');
    if (urlVariant) currentVariantId = urlVariant;

    // 2. DOM selects/inputs
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

    // 3. Price element
    const priceEl = document.querySelector('.price, .product-price, [data-price]');
    if (priceEl) {
      const raw = priceEl.textContent || priceEl.getAttribute('data-price') || '';
      const match = raw.match(/[\d,]+\.?\d*/);
      if (match) currentPrice = parseFloat(match[0].replace(/,/g, ''));
    }

    return { currentVariantId, currentPrice };
  }

  /* ------------------------------------------------------------------ *
   * MODAL
   * ------------------------------------------------------------------ */
  function createModal(triggerBtn) {
    const iframe = document.createElement('iframe');
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();

    iframe.src =
      `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}` +
      `&variantId=${encodeURIComponent(currentVariantId || '')}` +
      `&title=${encodeURIComponent(settings.productTitle)}` +
      `&price=${currentPrice}` +
      `&userId=${encodeURIComponent(settings.userId)}`;
    iframe.id = 'bidit-modal-iframe';

    // dropdown mode
    if (settings.modalStyle === 'dropdown' && triggerBtn) {
      const rect = triggerBtn.getBoundingClientRect();
      const { w, h } = getModalDims();

      let left = rect.left;
      let top = rect.bottom + 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pxW = parseInt(w);
      const pxH = parseInt(h);

      if (left + pxW > vw) left = vw - pxW - 20;
      if (left < 20) left = 20;
      if (top + pxH > vh) top = rect.top - pxH - 10;
      if (top < 20) top = 20;

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

    window.addEventListener('message', (ev) => {
      if (ev.origin !== settings.modalUrl) return;
      if (ev.data.type === 'BIDIT_CLOSE') closeModal();
    });

    return iframe;
  }

  function openModal(btn) {
    if (document.getElementById('bidit-modal-iframe')) return;
    document.body.appendChild(createModal(btn));
    if (settings.modalStyle === 'fullscreen') document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const ifr = document.getElementById('bidit-modal-iframe');
    if (ifr) ifr.remove();
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------ *
   * BUTTON HANDLING
   * ------------------------------------------------------------------ */
  function styleExistingBtn(btn) {
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
      transition:transform .2s ease,box-shadow .2s ease!important;min-height:48px!important;
    `;
    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(240,120,60,.4)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 2px 8px rgba(240,120,60,.3)';
    };
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(btn);
    };
  }

  function autoInjectBtn() {
    const form = document.querySelector('form[action*="/cart/add"]');
    if (!form) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    styleExistingBtn(btn);
    form.appendChild(btn);
  }

  /* ------------------------------------------------------------------ *
   * VARIANT CHANGE LISTENER
   * ------------------------------------------------------------------ */
  function setupVariantListeners() {
    const selectors = [
      'select[name="id"]',
      'select[data-variant-select]',
      '.single-option-selector',
      'input[name="id"]',
      'input[data-variant-id]',
      '[data-variant-selector]'
    ];
    selectors.forEach((sel) =>
      document.querySelectorAll(sel).forEach((el) =>
        el.addEventListener('change', refreshIFrameSrc)
      )
    );
    document.addEventListener('variant:change', refreshIFrameSrc);

    /* monitor URL variant changes */
    let lastURL = location.href;
    setInterval(() => {
      if (location.href !== lastURL) {
        lastURL = location.href;
        refreshIFrameSrc();
      }
    }, 500);
  }

  function refreshIFrameSrc() {
    const iframe = document.getElementById('bidit-modal-iframe');
    if (!iframe) return;
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();
    iframe.src =
      `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}` +
      `&variantId=${encodeURIComponent(currentVariantId || '')}` +
      `&title=${encodeURIComponent(settings.productTitle)}` +
      `&price=${currentPrice}` +
      `&userId=${encodeURIComponent(settings.userId)}`;
  }

  /* ------------------------------------------------------------------ *
   * INIT
   * ------------------------------------------------------------------ */
  function init() {
    const btns = document.querySelectorAll(settings.buttonSelector);
    btns.forEach(styleExistingBtn);
    if (btns.length === 0) autoInjectBtn();
    setupVariantListeners();
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

  /* expose */
  window.BidIt = { open: openModal, close: closeModal, init };
})();
</script>