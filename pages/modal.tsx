import React, { useState, useEffect } from 'react'
import BidItModal from '@/components/BidItModal'
import { useRouter } from 'next/router'
import { track } from '@vercel/analytics'

export default function ModalPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    shopifyProductId: '',
    shopifyVariantId: '',
    productTitle: '',
    productPrice: 0,
    cartId: '',
    counterBidOverride: false
  })

  useEffect(() => {
    // Extract parameters from URL
    const { productId, variantId, title, price, cartId, counterBidOverride } = router.query
    
    // Handle both product mode and cart mode
    if (productId && title && price) {
      // Product mode - decode the title to handle HTML entities like &#39;
      const decodedTitle = decodeURIComponent(title as string)
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
      
      const config = {
        shopifyProductId: productId as string,
        shopifyVariantId: (variantId as string) || '',
        productTitle: decodedTitle,
        productPrice: parseFloat(price as string),
        cartId: (cartId as string) || '',
        counterBidOverride: counterBidOverride === 'true'
      }
      setModalConfig(config)
      setIsModalOpen(true)
      
      // Track modal page load
      track('bidit_modal_page_loaded', {
        productId: config.shopifyProductId,
        productTitle: config.productTitle,
        productPrice: config.productPrice,
        variantId: config.shopifyVariantId || null
      })
    } else if (title && price) {
      // Cart mode - no productId provided
      const decodedTitle = decodeURIComponent(title as string)
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
      
      const config = {
        shopifyProductId: '', // Empty for cart mode
        shopifyVariantId: '',
        productTitle: decodedTitle,
        productPrice: parseFloat(price as string),
        cartId: (cartId as string) || '',
        counterBidOverride: counterBidOverride === 'true'
      }
      setModalConfig(config)
      setIsModalOpen(true)
      
      // Track modal page load for cart mode
      track('bidit_modal_page_loaded', {
        productId: 'cart',
        productTitle: config.productTitle,
        productPrice: config.productPrice,
        variantId: null
      })
    }
  }, [router.query])

  const handleClose = () => {
    setIsModalOpen(false)
    // Send message to parent window to close iframe
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'BIDIT_CLOSE' }, '*')
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <BidItModal
        isOpen={isModalOpen}
        onClose={handleClose}
        shopifyProductId={modalConfig.shopifyProductId}
        shopifyVariantId={modalConfig.shopifyVariantId}
        productTitle={modalConfig.productTitle}
        productPrice={modalConfig.productPrice}
        cartId={modalConfig.cartId}
        counterBidOverride={modalConfig.counterBidOverride}
      />
    </div>
  )
} 