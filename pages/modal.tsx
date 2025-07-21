import React, { useState, useEffect } from 'react'
import BidItModal from '@/components/BidItModal'
import { useRouter } from 'next/router'

export default function ModalPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    shopifyProductId: '',
    shopifyVariantId: '',
    productTitle: '',
    productPrice: 0
  })

  useEffect(() => {
    // Extract parameters from URL
    const { productId, variantId, title, price } = router.query
    
    if (productId && title && price) {
      setModalConfig({
        shopifyProductId: productId as string,
        shopifyVariantId: (variantId as string) || '',
        productTitle: title as string,
        productPrice: parseFloat(price as string)
      })
      setIsModalOpen(true)
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
      />
    </div>
  )
} 