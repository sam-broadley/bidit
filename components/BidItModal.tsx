import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, type Product, type Bid, type BidLog } from '@/lib/supabase'
import { Info, DollarSign, CheckCircle, XCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { track } from '@vercel/analytics'

interface BidItModalProps {
  isOpen: boolean
  onClose: () => void
  shopifyProductId: string
  shopifyVariantId?: string
  productTitle?: string
  productPrice?: number
}

type BidStep = 'login' | 'product-info' | 'first-bid' | 'second-bid' | 'success' | 'failure'

interface BidQuality {
  message: string
  color: string
  icon: React.ReactNode
  position: number // 0-100 for position on the bar
}

const BidItModal: React.FC<BidItModalProps> = ({
  isOpen,
  onClose,
  shopifyProductId,
  shopifyVariantId,
  productTitle = 'Product',
  productPrice = 0
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
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now())
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({})
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  // Generate bid session ID on component mount
  useEffect(() => {
    const initializeModal = async () => {
      if (isOpen && !bidSessionId) {
        // Use a smaller number for bid_session_id to avoid integer overflow
        setBidSessionId(Math.floor(Math.random() * 1000000))
        logEvent('modal_opened', { shopifyProductId })
        track('bidit_modal_opened', { productId: shopifyProductId, productTitle })
        
        // Check if user is already logged in
        const storedUserId = localStorage.getItem('bidit_user_id')
        const storedEmail = localStorage.getItem('bidit_user_email')
        
        if (storedUserId && storedEmail) {
          // Verify user still exists in database
          try {
            const { data: user, error } = await supabase
              .from('users')
              .select('id')
              .eq('id', storedUserId)
              .eq('email', storedEmail)
              .single()

            if (!error && user) {
              // User exists, skip to first bid
              console.log('Auto-login successful for user:', storedUserId)
              setCurrentStep('first-bid')
            } else {
              // User doesn't exist in database, clear localStorage
              console.log('User not found in database, clearing localStorage')
              localStorage.removeItem('bidit_user_id')
              localStorage.removeItem('bidit_user_email')
              localStorage.removeItem('bidit_user_first_name')
              localStorage.removeItem('bidit_user_last_name')
            }
          } catch (err) {
            console.warn('Error checking user existence:', err)
            // Clear localStorage on error
            localStorage.removeItem('bidit_user_id')
            localStorage.removeItem('bidit_user_email')
            localStorage.removeItem('bidit_user_first_name')
            localStorage.removeItem('bidit_user_last_name')
          }
        }
      }
    }

    initializeModal()
  }, [isOpen, bidSessionId, shopifyProductId])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!bidSessionId) return

    // Subscribe to bid_logs for this session
    const bidLogsSubscription = supabase
      .channel(`bid_logs_${bidSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bid_logs',
          filter: `bid_session_id=eq.${bidSessionId}`
        },
        (payload) => {
          console.log('Real-time bid log:', payload.new)
          setRealtimeEvents(prev => [...prev, { type: 'log', data: payload.new, timestamp: Date.now() }])
        }
      )
      .subscribe()

    // Subscribe to bids for this session
    const bidsSubscription = supabase
      .channel(`bids_${bidSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bids',
          filter: `bid_session_id=eq.${bidSessionId}`
        },
        (payload) => {
          console.log('Real-time bid update:', payload)
          setRealtimeEvents(prev => [...prev, { type: 'bid', data: payload.new, event: payload.eventType, timestamp: Date.now() }])
        }
      )
      .subscribe()

    // Cleanup subscriptions when component unmounts or session changes
    return () => {
      bidLogsSubscription.unsubscribe()
      bidsSubscription.unsubscribe()
    }
  }, [bidSessionId])

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

  const logEvent = async (eventType: string, eventData?: any, timeSpentMs?: number) => {
    try {
      await supabase.from('bid_logs').insert({
        bid_id: currentBidId,
        bid_session_id: bidSessionId,
        event_type: eventType,
        event_data: eventData,
        time_spent_ms: timeSpentMs
      })
    } catch (err) {
      console.error('Error logging event:', err)
    }
  }

  const trackStepTiming = (step: BidStep) => {
    const currentTime = Date.now()
    const timeSpent = currentTime - stepStartTime
    
    // Log the time spent on the previous step
    if (stepStartTime > 0) {
      logEvent('step_timing', {
        step: currentStep,
        timeSpentSeconds: Math.round(timeSpent / 1000)
      }, timeSpent) // Pass timeSpent to the dedicated column
    }
    
    // Update step timings state
    setStepTimings(prev => ({
      ...prev,
      [currentStep]: timeSpent
    }))
    
    // Reset start time for the new step
    setStepStartTime(currentTime)
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getBidQuality = (amount: number): BidQuality => {
    if (!product) return { message: 'Enter a bid', color: 'text-gray-500', icon: <Info className="w-4 h-4" />, position: 50 }
    
    const discountPercent = ((product.price - amount) / product.price) * 100
    
    // Calculate position based on acceptance likelihood (0-100%)
    let position = 50 // default middle
    
    if (amount >= product.price) {
      // At or above retail price - guaranteed acceptance
      position = 100
      return { message: 'Guaranteed acceptance!', color: 'text-green-500', icon: <TrendingUp className="w-4 h-4" />, position }
    }
    
    // For bids within or outside the acceptable range, use a smooth curve
    // Position represents likelihood of acceptance (0% = no chance, 100% = guaranteed)
    
    if (discountPercent <= product.max_discount_percent) {
      // Within or below max discount - use smooth curve
      // $99 (0% discount) = 99% position
      // $89 (11% discount) = 90% position  
      // $75 (25% discount) = 60% position
      // $50 (50% discount) = 40% position
      
      // Use linear interpolation with your calibration points
      if (discountPercent <= 11) {
        // 0% to 11% discount: linear from 99% to 90%
        position = 99 - (discountPercent / 11) * 9
      } else if (discountPercent <= 25) {
        // 11% to 25% discount: linear from 90% to 60%
        position = 90 - ((discountPercent - 11) / 14) * 30
      } else if (discountPercent <= 50) {
        // 25% to 50% discount: linear from 60% to 40%
        position = 60 - ((discountPercent - 25) / 25) * 20
      } else {
        // 50% to 30% discount: linear from 40% to 40%
        position = Math.max(0, 40)
      }
    } else {
      // Above max discount - rapid decline
      // $20 (80% discount) = 20% position
      // $5 (95% discount) = 0% position
      const excessDiscount = discountPercent - product.max_discount_percent
      if (discountPercent <= 80) {
        // 30% to 80% discount: linear from 40% to 20%
        position = Math.max(0, 40 - ((discountPercent - 30) / 50) * 20)
      } else {
        // 80% to 95% discount: linear from 20% to 0%
        position = Math.max(0, 20 - ((discountPercent - 80) / 15) * 20)
      }
    }
    
    // Determine message and color based on position
    if (position >= 80) {
      return { message: 'Excellent offer!', color: 'text-green-500', icon: <TrendingUp className="w-4 h-4" />, position }
    } else if (position >= 60) {
      return { message: 'Looking good!', color: 'text-green-500', icon: <TrendingUp className="w-4 h-4" />, position }
    } else if (position >= 40) {
      return { message: 'Fair offer', color: 'text-yellow-500', icon: <TrendingUp className="w-4 h-4" />, position }
    } else if (position >= 20) {
      return { message: 'Try higher', color: 'text-orange-500', icon: <TrendingDown className="w-4 h-4" />, position }
    } else {
      return { message: 'Too low', color: 'text-red-500', icon: <TrendingDown className="w-4 h-4" />, position }
    }
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

    // Get user ID from localStorage
    const storedUserId = localStorage.getItem('bidit_user_id')
    const currentUserId = storedUserId ? parseInt(storedUserId) : null
    
    console.log('Submitting bid with user ID:', currentUserId, 'from localStorage:', storedUserId)

    try {
      // Insert bid
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .insert({
          bid_session_id: bidSessionId,
          user_id: currentUserId,
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
      track('bidit_bid_submitted', { 
        productId: shopifyProductId, 
        productTitle, 
        bidAmount: amount, 
        productPrice 
      })

      // Simulate bid evaluation (in real app, this would be an edge function)
      const discountPercent = ((product.price - amount) / product.price) * 100
      // Accept bids that are at or above the product price, or within the acceptable discount range
      const isAccepted = amount >= product.price || (discountPercent >= product.min_discount_percent && discountPercent <= product.max_discount_percent)

      // Update bid status
      await supabase
        .from('bids')
        .update({ 
          status: isAccepted ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', bidData.id)

      logEvent('bid_evaluated', { bidId: bidData.id, accepted: isAccepted })
      track('bidit_bid_evaluated', { 
        productId: shopifyProductId, 
        productTitle, 
        bidAmount: amount, 
        productPrice, 
        accepted: isAccepted 
      })

      if (isAccepted) {
        trackStepTiming('success')
        setCurrentStep('success')
      } else {
        setBidsRemaining(prev => prev - 1)
        if (bidsRemaining <= 1) {
          trackStepTiming('failure')
          setCurrentStep('failure')
        } else {
          trackStepTiming('second-bid')
          setCurrentStep('second-bid')
        }
      }
    } catch (err) {
      console.error('Error submitting bid:', err)
      console.log('Bid data that failed:', {
        bid_session_id: bidSessionId,
        user_id: currentUserId,
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

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError(null)
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
    setEmailError(null)
    setCurrentBidId(null)
    setStepStartTime(Date.now())
    setStepTimings({})
    setRealtimeEvents([])
    setFirstName('')
    setLastName('')
    setEmail('')
    // Clear user data from localStorage
    localStorage.removeItem('bidit_user_id')
    localStorage.removeItem('bidit_user_email')
    localStorage.removeItem('bidit_user_first_name')
    localStorage.removeItem('bidit_user_last_name')
  }

  const handleClose = () => {
    // Track timing for the current step before closing
    const currentTime = Date.now()
    const timeSpent = currentTime - stepStartTime
    
    logEvent('modal_closed', { 
      step: currentStep,
      timeSpentSeconds: Math.round(timeSpent / 1000),
      totalSessionTimeMs: Object.values(stepTimings).reduce((sum, time) => sum + time, 0) + timeSpent
    }, timeSpent) // Pass timeSpent to the dedicated column
    
    track('bidit_modal_closed', { 
      productId: shopifyProductId, 
      productTitle, 
      step: currentStep,
      timeSpentSeconds: Math.round(timeSpent / 1000)
    })
    
    resetModal()
    onClose()
  }

  const handleAddToCart = () => {
    logEvent('add_to_cart_clicked', { bidAmount, productTitle, productPrice })
    track('bidit_add_to_cart', { 
      productId: shopifyProductId, 
      productTitle, 
      bidAmount, 
      productPrice 
    })
    handleClose()
  }

  const handleContinueShopping = () => {
    logEvent('continue_shopping_clicked', { step: currentStep })
    track('bidit_continue_shopping', { 
      productId: shopifyProductId, 
      productTitle, 
      step: currentStep 
    })
    handleClose()
  }

  const handleStartBidding = () => {
    logEvent('start_bidding_clicked', { productTitle, productPrice })
    track('bidit_start_bidding', { productId: shopifyProductId, productTitle, productPrice })
    trackStepTiming('login')
    setCurrentStep('login')
  }

  const handleLogin = async () => {
    if (!firstName || !lastName || !email) {
      setError('Please enter your first name, last name, and email address')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Check if user already exists in public.users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      let userId: number

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new user in public.users table only
        console.log('Creating new user for email:', email)
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ 
            email: email,
            first_name: firstName,
            last_name: lastName
          })
          .select('id')
          .single()

        if (createError) {
          console.warn('User creation failed:', createError.message)
          // Fallback to local storage with a simple hash
          userId = Math.abs(email.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000000
        } else {
          userId = newUser.id
          console.log('Created user with ID:', userId)
          logEvent('user_created', { email, userId })
        }
      } else if (fetchError) {
        throw fetchError
      } else {
        // User exists
        userId = existingUser.id
        console.log('Existing user found:', { userId })
        logEvent('user_logged_in', { email, userId })
      }

      // Store user info in localStorage for persistence
      localStorage.setItem('bidit_user_id', userId.toString())
      localStorage.setItem('bidit_user_email', email)
      localStorage.setItem('bidit_user_first_name', firstName)
      localStorage.setItem('bidit_user_last_name', lastName)

      // Log successful login
      logEvent('login_successful', { email, userId }, Date.now() - stepStartTime)
      track('bidit_login_successful', { productId: shopifyProductId, productTitle })

      // Move to first bid step
      trackStepTiming('first-bid')
      setCurrentStep('first-bid')
    } catch (err: any) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
      logEvent('login_failed', { email, error: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <div className="flex flex-col justify-between h-full">
            {/* Header */}
            <div className="text-center">
              <h2 className="font-regular text-2xl mb-5">Connect to Bidit</h2>
              <p className="text-black text-[15px] mb-5">
              To continue with Bidit, log in using your The Iconic account to start bidding.
              </p>
              <span className="text-sm text-gray-500 block">
                This is a demo only - your email is used solely for tracking within the demonstration and isn't linked to your actual The Iconic account.
                </span>
            </div>

            {/* Login Form */}
            <div className="login-form">
              <div className="input-group">
                <label htmlFor="firstName" className="input-label">
                  First name*
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="First name*"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="login-input"
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="lastName" className="input-label">
                  Last name*
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name*"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="login-input"
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="email" className="input-label">
                  Email address*
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email address*"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`login-input ${emailError ? 'border-red-500' : ''}`}
                  style={{ borderRadius: '0px' }}
                />
                {emailError && (
                  <div className="text-red-500 text-sm mt-1">{emailError}</div>
                )}
              </div>

              {error && (
                <div className="error-message">{error}</div>
              )}

              <button 
                onClick={handleLogin} 
                disabled={isLoading || !firstName || !lastName || !email || !!emailError}
                className="login-button"
                style={{ backgroundColor: '#42abc8', borderRadius: '0px' }}
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </div>

            <style jsx>{`
              .login-title {
                font-size: 24px;
                font-weight: bold;
                color: #1a1a1a;
                margin-bottom: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              
              .login-description {
                font-size: 14px;
                color: #666;
                line-height: 1.4;
                margin-bottom: 24px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              
              .login-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }
              
              .input-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              
              .input-label {
                font-size: 14px;
                font-weight: 500;
                color: #1a1a1a;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              
              .login-input {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: white;
                color: #1a1a1a;
                transition: border-color 0.2s ease;
              }
              
              .login-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              }
              
              .login-input::placeholder {
                color: #9ca3af;
              }
              
              .login-button {
                width: 100%;
                padding: 12px 16px;
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                cursor: pointer;
                transition: background-color 0.2s ease;
              }
              
              .login-button:hover:not(:disabled) {
                background-color: #2563eb;
              }
              
              .login-button:disabled {
                background-color: #9ca3af;
                cursor: not-allowed;
              }
              
              .error-message {
                color: #dc2626;
                font-size: 14px;
                background-color: #fef2f2;
                padding: 12px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
            `}</style>

            {/* Footer */}
            
          </div>
        )

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

            {/* Product details */}
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium text-gray-900">{productTitle}</h3>
              <div className="text-4xl font-bold text-orange-500">
                ${productPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">Full price</p>
            </div>
            
           

            {/* Bids remaining and CTA */}
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-900">
                You have {bidsRemaining} bids
              </p>
              <Button 
                onClick={handleStartBidding} 
                className="w-full bg-black hover:bg-gray-800 text-white font-normal py-4 rounded-[10px] text-base flex items-center justify-center gap-2"
              >
                Login with<img src="https://res.cloudinary.com/stitchify/image/upload/v1753082476/vkndfqezsyzv14gwbkxf.png" alt="The Iconic" className="h-3" />
                {/* <ArrowRight className="w-5 h-5" /> */}
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
                <div className="flex items-center justify-center gap-2 text-red-600 font-bold text-lg">
                  <XCircle className="w-5 h-5" />
                  <span>Bid Unsuccessful</span>
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
                <div className="space-y-3">
                  {/* Color Bar */}
                  <div className="relative h-3 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                    {/* Position indicator - circle with shadow */}
                    <div 
                      className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 border-2 border-gray-200"
                      style={{ left: `${bidQuality.position}%` }}
                    />
                  </div>
                </div>
              )}
              
 
  
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
              )}
              
              <div className="text-center text-sm text-gray-600">
                You have {bidsRemaining} bid{bidsRemaining !== 1 ? 's' : ''}
              </div>

              <Button 
                onClick={submitBid} 
                disabled={isLoading || !bidAmount}
                className="w-full bg-orange-500 hover:bg-orange-700 text-white font-medium py-4 rounded-[10px] text-base"
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

           
            
            <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
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
                onClick={handleAddToCart} 
                className="w-full bg-orange-500 hover:bg-orange-700 text-white font-medium py-4 rounded-[10px] text-base"
              >
                Add to Cart
              </Button>
              <Button 
                onClick={handleContinueShopping} 
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-4 rounded-[10px] text-base"
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
              onClick={handleContinueShopping} 
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-[10px] text-base"
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
        <DialogContent className="h-full w-full overflow-y-auto bg-white !rounded-[20px] shadow-2xl border-0 p-8 sm:p-6">
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