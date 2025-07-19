(function() {
  'use strict';

  // Configuration from Shopify theme
  const config = window.BidItConfig || {};
  
  // Default configuration
  const defaults = {
    productId: '',
    variantId: '',
    productTitle: '',
    productPrice: 0,
    userId: '',
    buttonSelector: '[data-bidit-button]',
    buttonText: 'Try BidIt - Make an Offer'
  };

  // Merge config with defaults
  const settings = { ...defaults, ...config };

  // Get current variant information
  function getCurrentVariantInfo() {
    let currentVariantId = settings.variantId;
    let currentPrice = settings.productPrice;
    
    // First, try to get variant from URL (most reliable)
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get('variant');
    if (urlVariant) {
      currentVariantId = urlVariant;
      console.log('Variant from URL:', urlVariant);
    }
    
    // Fallback to form elements if URL doesn't have variant
    if (!urlVariant) {
      // Try to get variant from common Shopify selectors
      const variantSelect = document.querySelector('select[name="id"], select[data-variant-select], .single-option-selector');
      const variantInput = document.querySelector('input[name="id"]:checked, input[data-variant-id]');
      
      if (variantSelect && variantSelect.value) {
        currentVariantId = variantSelect.value;
        console.log('Variant from select:', variantSelect.value);
      } else if (variantInput && variantInput.value) {
        currentVariantId = variantInput.value;
        console.log('Variant from input:', variantInput.value);
      }
    }
    
    // Try to get current price from the page
    const priceElement = document.querySelector('.price, .product-price, [data-price]');
    if (priceElement) {
      const priceText = priceElement.textContent || priceElement.getAttribute('data-price');
      if (priceText) {
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          currentPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
        }
      }
    }
    
    console.log('Final variant ID:', currentVariantId);
    return { currentVariantId, currentPrice };
  }

  // Open modal by dispatching a custom event
  function openModal(triggerButton = null) {
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();
    
    // Create and dispatch a custom event to open the React modal
    const modalEvent = new CustomEvent('openBidItModal', {
      detail: {
        shopifyProductId: settings.productId,
        shopifyVariantId: currentVariantId || '',
        productTitle: settings.productTitle,
        productPrice: currentPrice,
        userId: settings.userId
      }
    });
    
    window.dispatchEvent(modalEvent);
  }

  // Create BidIt button
  function createBidItButton() {
    const button = document.createElement('button');
    button.className = 'bidit-button';
    
    // Create the button content with logo and text
    button.innerHTML = `
      <img 
        src="https://res.cloudinary.com/stitchify/image/upload/v1752902760/b5ltsnlhwpan9rhknbir.png" 
        alt="BidIt" 
        style="height: 17px; width: auto;"
      />
      <span style="font-weight: 500; font-size: 14px;">Make an offer</span>
    `;
    
    // Apply comprehensive styling that overrides merchant CSS
    button.style.cssText = `
      background: #FFF!important;
      color: #000 !important;
      border: #99999960 1px solid !important;
      padding: 12px 24px !important;
      border-radius: 0px !important;
      font-weight: 600 !important;
      margin-top: 10px !important;
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
      text-decoration: none !important;
      outline: none !important;
      position: relative !important;
      z-index: 1 !important;
      min-height: 48px !important;
      box-sizing: border-box !important;
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) !important';
      this.style.boxShadow = '0 4px 12px rgba(240, 120, 60, 0.4) !important';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) !important';
      this.style.boxShadow = '0 2px 8px rgba(240, 120, 60, 0.3) !important';
    });
    
    // Add click handler
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openModal(this);
    });
    
    return button;
  }

  // Initialize BidIt
  function init() {
    // Find existing BidIt buttons
    const existingButtons = document.querySelectorAll(settings.buttonSelector);
    
    existingButtons.forEach(button => {
      // Apply consistent styling to existing buttons
      button.innerHTML = `
      <span style="font-weight: 500; font-size: 15px;">Make an offer with</span>
      <img 
        src="https://res.cloudinary.com/stitchify/image/upload/v1752903381/qxofvucv6vaumewupadp.png" 
        alt="BidIt" 
        style="height: 15px; width: auto;"
      />
    `;
    
    // Apply comprehensive styling that overrides merchant CSS
    button.style.cssText = `
      background: #F85711!important;
      color: #FFF !important;
      border: #99999960 1px solid !important;
      padding: 12px 24px !important;
      border-radius: 0px !important;
      gap: 4.5px !important;
      font-weight: 600 !important;
      margin-top: 10px !important;
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
      text-decoration: none !important;
      outline: none !important;
      position: relative !important;
      z-index: 1 !important;
      min-height: 48px !important;
      box-sizing: border-box !important;
    `;
      
      // Add hover effects
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px) !important';
        this.style.boxShadow = '0 4px 12px rgba(240, 120, 60, 0.4) !important';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) !important';
        this.style.boxShadow = '0 2px 8px rgba(240, 120, 60, 0.3) !important';
      });
      
      // Prevent form submission
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openModal(this);
      });
    });

    // Auto-inject button if no existing buttons found
    if (existingButtons.length === 0) {
      const productForm = document.querySelector('form[action*="/cart/add"]');
      if (productForm) {
        const bidItButton = createBidItButton();
        productForm.appendChild(bidItButton);
      }
    }

    // Listen for variant changes
    function setupVariantChangeListeners() {
      // Common Shopify variant selectors
      const variantSelectors = [
        'select[name="id"]',
        'select[data-variant-select]',
        '.single-option-selector',
        'input[name="id"]',
        'input[data-variant-id]'
      ];
      
      variantSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.addEventListener('change', function() {
            console.log('Variant changed:', this.value);
            // You could update button text or styling here if needed
          });
        });
      });
    }

    setupVariantChangeListeners();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose functions globally for debugging
  window.BidIt = {
    openModal,
    init,
    settings
  };

})(); 