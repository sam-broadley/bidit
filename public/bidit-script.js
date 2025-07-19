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

  // Create and open modal
  function openModal(triggerButton = null) {
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();
    
    console.log('BidIt: Opening modal with data:', {
      shopifyProductId: settings.productId,
      shopifyVariantId: currentVariantId || '',
      productTitle: settings.productTitle,
      productPrice: currentPrice,
      userId: settings.userId
    });
    
    // Remove existing modal if present
    const existingModal = document.getElementById('bidit-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'bidit-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      backdrop-filter: blur(4px);
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 20px;
      width: 90vw;
      max-width: 400px;
      height: 500px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    `;
    
    // Create iframe for the modal content
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 20px;
    `;
    
    // Build the URL with parameters
    const params = new URLSearchParams({
      productId: settings.productId,
      variantId: currentVariantId || '',
      title: settings.productTitle,
      price: currentPrice.toString(),
      userId: settings.userId
    });
    
    iframe.src = `https://bidit-tau.vercel.app/modal?${params.toString()}`;
    
    // Add close functionality
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Add escape key listener
    const handleEscape = function(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Store the escape handler for cleanup
    modal._escapeHandler = handleEscape;
    
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Hide body overflow
    document.body.style.overflow = 'hidden';
    
    console.log('BidIt: Modal opened');
  }
  
  // Close modal
  function closeModal() {
    const modal = document.getElementById('bidit-modal');
    if (modal) {
      // Remove escape key listener
      if (modal._escapeHandler) {
        document.removeEventListener('keydown', modal._escapeHandler);
      }
      modal.remove();
      document.body.style.overflow = '';
      console.log('BidIt: Modal closed');
    }
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
    // Listen for close messages from iframe
    window.addEventListener('message', function(event) {
      if (event.data.type === 'BIDIT_CLOSE') {
        closeModal();
      }
    });
    
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
    closeModal,
    init,
    settings
  };

})(); 