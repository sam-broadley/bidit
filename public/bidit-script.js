(function() {
  'use strict';

  // Configuration from Shopify theme
  const config = window.BidItConfig || {};
  
  // Default configuration
  const defaults = {
    modalUrl: 'https://bidit-modal.vercel.app',
    productId: '',
    productTitle: '',
    productPrice: 0,
    userId: '',
    buttonSelector: '[data-bidit-button]',
    buttonText: 'Try BidIt - Make an Offer',
    modalStyle: 'fullscreen', // 'fullscreen' or 'dropdown'
    modalWidth: '400px',
    modalHeight: '600px'
  };

  // Merge config with defaults
  const settings = { ...defaults, ...config };

  // Create modal iframe
  function createModal(triggerButton = null) {
    const iframe = document.createElement('iframe');
    iframe.src = `${settings.modalUrl}/modal?productId=${encodeURIComponent(settings.productId)}&title=${encodeURIComponent(settings.productTitle)}&price=${settings.productPrice}&userId=${encodeURIComponent(settings.userId)}`;
    
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
      const modalWidth = parseInt(settings.modalWidth);
      const modalHeight = parseInt(settings.modalHeight);
      
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