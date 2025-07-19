import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, type Product, type Bid, type BidLog } from '@/lib/supabase'
import { Info, DollarSign, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface BidItModalProps {
  isOpen: boolean
  onClose: () => void
  shopifyProductId: string
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
        amount: amount
      })
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
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{productTitle}</h3>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
                <DollarSign className="w-6 h-6" />
                {productPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-2">Full price</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">How BidIt works</span>
              </div>
              <p className="text-sm text-blue-700">
                You're bidding against the merchant, not other customers. Offer what you're willing to pay - if accepted, you can buy at that price!
              </p>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 mb-2">
                You have {bidsRemaining} bids remaining
              </div>
              <Button onClick={() => setCurrentStep('first-bid')} className="w-full">
                Start Bidding
              </Button>
            </div>
          </div>
        )

      case 'first-bid':
      case 'second-bid':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{productTitle}</h3>
              <div className="flex items-center justify-center gap-2 text-xl font-bold text-green-600">
                <DollarSign className="w-5 h-5" />
                {productPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Full price</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bid-amount">Your Bid Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="bid-amount"
                    type="number"
                    placeholder="0.00"
                    value={bidAmount}
                    onChange={(e) => handleBidChange(e.target.value)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {bidQuality && (
                <div className={`flex items-center gap-2 p-3 rounded-lg bg-gray-50 ${bidQuality.color}`}>
                  {bidQuality.icon}
                  <span className="font-medium">{bidQuality.message}</span>
                </div>
              )}
              
              {product && (
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 Acceptable range: ${(product.price * (1 - product.max_discount_percent / 100)).toFixed(2)} - ${(product.price * (1 - product.min_discount_percent / 100)).toFixed(2)} 
                  (${product.min_discount_percent}% - ${product.max_discount_percent}% discount)
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="text-center text-sm text-gray-600">
                {bidsRemaining} bid{bidsRemaining !== 1 ? 's' : ''} remaining
              </div>

              <Button 
                onClick={submitBid} 
                disabled={isLoading || !bidAmount}
                className="w-full"
              >
                {isLoading ? 'Submitting...' : currentStep === 'second-bid' ? 'Submit Final Bid' : 'Submit Bid'}
              </Button>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Your Bid was SUCCESSFUL!</h3>
              <p className="text-gray-600 mb-4">
                Congratulations! Your bid of <span className="font-semibold">${bidAmount}</span> was accepted.
              </p>
              <p className="text-sm text-gray-500">
                You can now purchase this item at your bid price.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Continue Shopping
            </Button>
          </div>
        )

      case 'failure':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Bid Not Successful</h3>
              <p className="text-gray-600 mb-4">
                Unfortunately, your bids were not accepted. But don't worry!
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Special Offer:</strong> Get 10% off this item with code <span className="font-mono bg-yellow-200 px-2 py-1 rounded">BIDIT10</span>
                </p>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {currentStep === 'success' ? 'Bid Successful!' : 
             currentStep === 'failure' ? 'Bid Results' : 
             'BidIt - Make an Offer'}
          </DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  )
}

export default BidItModal 