(function() {
  'use strict';

  // Configuration from Shopify theme
  const config = window.BidItConfig || {};
  
  // Default configuration
  const defaults = {
    modalUrl: 'https://bidit-tau.vercel.app',
    productId: '',
    variantId: '',
    productTitle: '',
    productPrice: 0,
    userId: '',
    buttonSelector: '[data-bidit-button]',
    buttonText: 'Try BidIt - Make an Offer',
    modalStyle: 'dropdown', // Default to dropdown for better UX
    modalWidth: '450px',    // Slightly wider for better content display
    modalHeight: '650px'    // Taller to accommodate full content
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

  // Create modal iframe
  function createModal(triggerButton = null) {
    const iframe = document.createElement('iframe');
    const { currentVariantId, currentPrice } = getCurrentVariantInfo();
    
    iframe.src = `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}&variantId=${encodeURIComponent(currentVariantId || '')}&title=${encodeURIComponent(settings.productTitle)}&price=${currentPrice}&userId=${encodeURIComponent(settings.userId)}`;
    
    // Determine modal positioning based on style
    if (settings.modalStyle === 'dropdown' && triggerButton) {
      // Dropdown style - position below the button
      const buttonRect = triggerButton.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position
      let left = buttonRect.left;
      let top = buttonRect.bottom + 10; // 10px gap below button
      
      // Ensure modal doesn't go off-screen
      let modalWidth = parseInt(settings.modalWidth);
      let modalHeight = parseInt(settings.modalHeight);
      
      // Responsive sizing for mobile devices
      if (viewportWidth < 768) {
        modalWidth = Math.min(modalWidth, viewportWidth - 40); // 20px margin on each side
        modalHeight = Math.min(modalHeight, viewportHeight - 40); // 20px margin on top/bottom
      }
      
      // Adjust horizontal position if needed
      if (left + modalWidth > viewportWidth) {
        left = viewportWidth - modalWidth - 20; // 20px margin from edge
      }
      if (left < 20) left = 20; // Minimum 20px from left edge
      
      // Adjust vertical position if needed
      if (top + modalHeight > viewportHeight) {
        // Show above button instead
        top = buttonRect.top - modalHeight - 10;
        if (top < 20) top = 20; // Minimum 20px from top edge
      }
      
      iframe.style.cssText = `
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        width: ${settings.modalWidth};
        height: ${settings.modalHeight};
        border: none;
        border-radius: 12px;
        z-index: 999999;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        background: white;
      `;
    } else {
      // Fullscreen style (default)
      iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.5);
      `;
    }
    
    iframe.id = 'bidit-modal-iframe';
    
    // Handle modal close
    window.addEventListener('message', function(event) {
      if (event.origin !== settings.modalUrl) return;
      
      if (event.data.type === 'BIDIT_CLOSE') {
        closeModal();
      }
    });

    return iframe;
  }

  // Open modal
  function openModal(triggerButton = null) {
    const iframe = createModal(triggerButton);
    document.body.appendChild(iframe);
    
    // Only hide body overflow for fullscreen mode
    if (settings.modalStyle === 'fullscreen') {
      document.body.style.overflow = 'hidden';
    }
  }

  // Close modal
  function closeModal() {
    const iframe = document.getElementById('bidit-modal-iframe');
    if (iframe) {
      iframe.remove();
      document.body.style.overflow = '';
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
        style="height: 20px; width: auto;"
      />
      <span style="font-weight: 500; font-size: 14px;">Make an offer</span>
    `;
    
    // Apply comprehensive styling that overrides merchant CSS
    button.style.cssText = `
      background: #FFF!important;
      color: white !important;
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
        <img 
          src="https://res.cloudinary.com/stitchify/image/upload/v1752899998/vnxne8rzryvm4paahoqj.png" 
          alt="BidIt" 
          style="height: 20px; width: auto;"
        />
        <span style="font-weight: 500; font-size: 14px;">Make an offer</span>
      `;
      
      // Apply comprehensive styling that overrides merchant CSS
      button.style.cssText = `
        background: #F0783C !important;
        color: white !important;
        border: none !important;
        padding: 12px 24px !important;
        border-radius: 50px !important;
        font-weight: 600 !important;
        margin-top: 10px !important;
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 2px 8px rgba(240, 120, 60, 0.3) !important;
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

    // Add global close handler
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeModal();
      }
    });

    // Listen for variant changes
    function setupVariantChangeListeners() {
      // Common Shopify variant selectors
      const variantSelectors = [
        'select[name="id"]',
        'select[data-variant-select]',
        '.single-option-selector',
        'input[name="id"]',
        'input[data-variant-id]',
        '[data-variant-selector]'
      ];

      variantSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.addEventListener('change', function() {
            console.log('Variant changed:', this.value);
            // Update any existing modal with new variant info
            const iframe = document.getElementById('bidit-modal-iframe');
            if (iframe) {
              const { currentVariantId, currentPrice } = getCurrentVariantInfo();
              const newSrc = `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}&variantId=${encodeURIComponent(currentVariantId || '')}&title=${encodeURIComponent(settings.productTitle)}&price=${currentPrice}&userId=${encodeURIComponent(settings.userId)}`;
              iframe.src = newSrc;
            }
          });
        });
      });

      // Listen for Shopify's custom variant change events
      document.addEventListener('variant:change', function(event) {
        console.log('Shopify variant change event:', event);
        const iframe = document.getElementById('bidit-modal-iframe');
        if (iframe) {
          const { currentVariantId, currentPrice } = getCurrentVariantInfo();
          const newSrc = `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}&variantId=${encodeURIComponent(currentVariantId || '')}&title=${encodeURIComponent(settings.productTitle)}&price=${currentPrice}&userId=${encodeURIComponent(settings.userId)}`;
          iframe.src = newSrc;
        }
      });

      // Listen for URL changes (some themes update URL when variant changes)
      let currentUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          console.log('URL changed, updating modal');
          const iframe = document.getElementById('bidit-modal-iframe');
          if (iframe) {
            const { currentVariantId, currentPrice } = getCurrentVariantInfo();
            const newSrc = `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}&variantId=${encodeURIComponent(currentVariantId || '')}&title=${encodeURIComponent(settings.productTitle)}&price=${currentPrice}&userId=${encodeURIComponent(settings.userId)}`;
            iframe.src = newSrc;
          }
        }
      }, 500); // Check more frequently for URL changes
    }

    // Setup variant change listeners
    setupVariantChangeListeners();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global functions
  window.BidIt = {
    open: openModal,
    close: closeModal,
    init: init
  };

})(); 