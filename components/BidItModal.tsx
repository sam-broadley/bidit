import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, type Product, type Bid, type BidLog } from '@/lib/supabase'
import { Info, DollarSign, CheckCircle, XCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface BidItModalProps {
  isOpen: boolean
  onClose: () => void
  shopifyProductId: string
  shopifyVariantId?: string
  productTitle?: string
  productPrice?: number
  userId?: string
}

type BidStep = 'login' | 'product-info' | 'first-bid' | 'second-bid' | 'success' | 'failure'

interface BidQuality {
  message: string
  color: string
  icon: React.ReactNode
}

const BidItModal: React.FC<BidItModalProps> = ({
  isOpen,
  onClose,
  shopifyProductId,
  shopifyVariantId,
  productTitle = 'Product',
  productPrice = 0,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState<BidStep>('product-info')
  const [product, setProduct] = useState<Product | null>(null)
  const [bidAmount, setBidAmount] = useState<string>('')
  const [bidsRemaining, setBidsRemaining] = useState(2)
  const [bidSessionId, setBidSessionId] = useState<number | null>(null)
  const [currentBidId, setCurrentBidId] = useState<number | null>(null)
  const [bidQuality, setBidQuality] = useState<BidQuality | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate bid session ID on component mount
  useEffect(() => {
    if (isOpen && !bidSessionId) {
      // Use a smaller number for bid_session_id to avoid integer overflow
      setBidSessionId(Math.floor(Math.random() * 1000000))
      logEvent('modal_opened', { shopifyProductId })
    }
  }, [isOpen, bidSessionId, shopifyProductId])

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && shopifyProductId) {
      fetchProduct()
    }
  }, [isOpen, shopifyProductId])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shopify_product_id', shopifyProductId)
        .single()

      if (error) throw error
      setProduct(data)
      logEvent('product_fetched', { productId: data.id })
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Failed to load product information')
    }
  }

  const logEvent = async (eventType: string, eventData?: any) => {
    try {
      await supabase.from('bid_logs').insert({
        bid_id: currentBidId,
        bid_session_id: bidSessionId, // Add session ID for pre-bid events
        event_type: eventType,
        event_data: eventData
      })
    } catch (err) {
      console.error('Error logging event:', err)
    }
  }

  const getBidQuality = (amount: number): BidQuality => {
    if (!product) return { message: 'Enter a bid', color: 'text-gray-500', icon: <Info className="w-4 h-4" /> }
    
    const discountPercent = ((product.price - amount) / product.price) * 100
    
    // If bid is above full price (negative discount), it's too high
    if (amount > product.price) {
      return { message: 'Above retail price!', color: 'text-red-500', icon: <TrendingDown className="w-4 h-4" /> }
    }
    
    // If discount is too high (asking for too much off)
    if (discountPercent > product.max_discount_percent) {
      return { message: 'Too much discount!', color: 'text-red-500', icon: <TrendingDown className="w-4 h-4" /> }
    }
    
    // If discount is in the sweet spot (will be accepted)
    if (discountPercent >= product.min_discount_percent && discountPercent <= product.max_discount_percent) {
      return { message: 'Hot! Likely accepted', color: 'text-green-500', icon: <TrendingUp className="w-4 h-4" /> }
    }
    
    // If discount is too low (not enough off)
    if (discountPercent < product.min_discount_percent) {
      if (discountPercent >= product.min_discount_percent * 0.7) {
        return { message: 'Getting warmer - try more discount', color: 'text-yellow-500', icon: <TrendingUp className="w-4 h-4" /> }
      } else if (discountPercent >= product.min_discount_percent * 0.4) {
        return { message: 'Too little discount', color: 'text-blue-500', icon: <TrendingDown className="w-4 h-4" /> }
      } else {
        return { message: 'Way too little discount', color: 'text-gray-500', icon: <TrendingDown className="w-4 h-4" /> }
      }
    }
    
    return { message: 'Enter a bid', color: 'text-gray-500', icon: <Info className="w-4 h-4" /> }
  }

  const submitBid = async () => {
    if (!product || !bidAmount || !bidSessionId) return

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Insert bid
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .insert({
          bid_session_id: bidSessionId,
          user_id: userId && userId !== 'undefined' ? parseInt(userId) : null,
          product_id: product.id,
          shopify_variant_id: shopifyVariantId ? parseInt(shopifyVariantId) : null,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single()

      if (bidError) throw bidError

      setCurrentBidId(bidData.id)
      logEvent('bid_submitted', { bidId: bidData.id, amount })

      // Simulate bid evaluation (in real app, this would be an edge function)
      const discountPercent = ((product.price - amount) / product.price) * 100
      const isAccepted = discountPercent >= product.min_discount_percent && discountPercent <= product.max_discount_percent

      // Update bid status
      await supabase
        .from('bids')
        .update({ 
          status: isAccepted ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', bidData.id)

      logEvent('bid_evaluated', { bidId: bidData.id, accepted: isAccepted })

      if (isAccepted) {
        setCurrentStep('success')
      } else {
        setBidsRemaining(prev => prev - 1)
        if (bidsRemaining <= 1) {
          setCurrentStep('failure')
        } else {
          setCurrentStep('second-bid')
        }
      }
    } catch (err) {
      console.error('Error submitting bid:', err)
      console.log('Bid data that failed:', {
        bid_session_id: bidSessionId,
        user_id: userId,
        product_id: product?.id,
        shopify_variant_id: shopifyVariantId ? parseInt(shopifyVariantId) : null,
        amount: amount
      })
      
      // Log more detailed error information
      if (err && typeof err === 'object') {
        console.error('Error details:', {
          message: (err as any).message,
          details: (err as any).details,
          hint: (err as any).hint,
          code: (err as any).code
        })
      }
      
      setError('Failed to submit bid. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBidChange = (value: string) => {
    setBidAmount(value)
    const amount = parseFloat(value)
    if (!isNaN(amount) && amount > 0) {
      setBidQuality(getBidQuality(amount))
    } else {
      setBidQuality(null)
    }
  }

  const resetModal = () => {
    setCurrentStep('product-info')
    setBidAmount('')
    setBidsRemaining(2)
    setBidQuality(null)
    setError(null)
    setCurrentBidId(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'product-info':
        return (
          <div className="flex flex-col justify-between h-full">
            {/* BidIt Logo */}
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/stitchify/image/upload/v1752904305/yfyfurus7bwlxwizi9ub.png" 
                alt="BidIt" 
                className="h-8 mx-auto"
              />
            </div>

            {/* Product details */}
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium text-gray-900">{productTitle}</h3>
              <div className="text-4xl font-bold text-orange-500">
                ${productPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">Full price</p>
            </div>
            
            {/* How BidIt works info box */}
            <div className="bg-gray-100 p-4 rounded-xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">How Bidit works</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  You're bidding against the merchant, not other customers. Offer what you're willing to pay - if accepted, you can buy at that price!
                </p>
              </div>
            </div>

            {/* Bids remaining and CTA */}
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-900">
                You have {bidsRemaining} bids remaining
              </p>
              <Button 
                onClick={() => setCurrentStep('first-bid')} 
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-[10px] text-base flex items-center justify-center gap-2"
              >
                Start Bidding
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )

      case 'first-bid':
      case 'second-bid':
        return (
          <div className="flex flex-col justify-between h-full">
            {/* BidIt Logo */}
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/stitchify/image/upload/v1752904305/yfyfurus7bwlxwizi9ub.png" 
                alt="BidIt" 
                className="h-8 mx-auto"
              />
            </div>

            {/* Product details */}
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold text-gray-900">{productTitle}</h3>
              <div className="text-4xl font-bold text-orange-500">
                ${productPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">Full price</p>
            </div>

                        {/* Bid input section */}
            <div className="space-y-6">
              {currentStep === 'second-bid' && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-800">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Bid Declined</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-2">
                    You still have one bid left. Try a different amount and let's see if this one works better.
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="bid-amount" className="text-sm font-medium text-gray-900 mb-2 block">
                  Your Bid Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="bid-amount"
                    type="number"
                    placeholder="0.00"
                    value={bidAmount}
                    onChange={(e) => handleBidChange(e.target.value)}
                    className="pl-10 py-3 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {bidQuality && (
                <div className={`flex items-center gap-3 p-4 rounded-xl bg-gray-50 ${bidQuality.color}`}>
                  {bidQuality.icon}
                  <span className="font-medium">{bidQuality.message}</span>
                </div>
              )}
              
 
  
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
              )}
              
              <div className="text-center text-sm text-gray-600">
                {bidsRemaining} bid{bidsRemaining !== 1 ? 's' : ''} remaining
              </div>

              <Button 
                onClick={submitBid} 
                disabled={isLoading || !bidAmount}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-[10px] text-base"
              >
                {isLoading ? 'Submitting...' : currentStep === 'second-bid' ? 'Submit Final Bid' : 'Submit Bid'}
              </Button>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col justify-between h-full text-center">
            {/* BidIt Logo */}
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/stitchify/image/upload/v1752904305/yfyfurus7bwlxwizi9ub.png" 
                alt="BidIt" 
                className="h-8 mx-auto"
              />
            </div>

            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-green-600">Your Bid was Successful!</h3>
              <p className="text-gray-700">
                Congratulations! Your bid of <span className="font-bold text-orange-500">${bidAmount}</span> was accepted.
              </p>
              <p className="text-sm text-gray-500">
                You can now purchase this item at your bid price.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleClose} 
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-[10px] text-base"
              >
                Add to Cart
              </Button>
              <Button 
                onClick={handleClose} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-4 rounded-[10px] text-base"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )

      case 'failure':
        return (
          <div className="flex flex-col justify-between h-full text-center">
            {/* BidIt Logo */}
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/stitchify/image/upload/v1752904305/yfyfurus7bwlxwizi9ub.png" 
                alt="BidIt" 
                className="h-8 mx-auto"
              />
            </div>

            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-red-600">Your Bid was Not Successful</h3>
              <p className="text-gray-700">
              </p>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <p className="text-medium text-yellow-800">
                  <strong>For using Bidit:</strong> Get 10% off this item with code <span className="font-mono bg-yellow-200 px-2 py-1 rounded">BIDIT10</span>
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleClose} 
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-[10px] text-base"
            >
              Continue Shopping
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-gray-200/80 backdrop-blur-sm" />
        <DialogContent className="h-full w-full overflow-y-auto bg-white !rounded-[20px] shadow-2xl border-0 p-4 sm:p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {currentStep === 'success' ? 'Bid Successful!' : 
               currentStep === 'failure' ? 'Bid Results' : 
               'BidIt - Make an Offer'}
            </DialogTitle>
          </DialogHeader>
          {renderStep()}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default BidItModal 