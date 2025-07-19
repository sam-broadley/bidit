import React, { useState } from 'react'
import BidItModal from '@/components/BidItModal'
import { Button } from '@/components/ui/button'
import { ShoppingBag, DollarSign } from 'lucide-react'

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sample product data (in real app, this would come from Shopify)
  const sampleProduct = {
    id: 'gid://shopify/Product/1',
    title: 'Nike Air Max',
    price: 180
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BidIt Demo
          </h1>
          <p className="text-lg text-gray-600">
            Experience the future of e-commerce pricing with our interactive bidding system
          </p>
        </div>

        {/* Sample Product Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {sampleProduct.title}
            </h2>
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
              <DollarSign className="w-6 h-6" />
              {sampleProduct.price.toFixed(2)}
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Try BidIt - Make an Offer
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Click the button above to experience the BidIt modal
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-blue-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Interactive Bidding</h3>
            <p className="text-gray-600">
              Make offers on products and get instant feedback on your bid quality
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-green-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Merchant vs Customer</h3>
            <p className="text-gray-600">
              Bid against the merchant, not other customers, for a fair pricing experience
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-purple-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
            <p className="text-gray-600">
              Every interaction is logged for insights and optimization
            </p>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Integration Instructions
          </h2>
          <div className="space-y-4 text-blue-800">
            <p>
              <strong>1. Environment Setup:</strong> Add your Supabase credentials to <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code>
            </p>
            <p>
              <strong>2. Shopify Integration:</strong> Add the modal script to your Shopify theme
            </p>
            <p>
              <strong>3. Database Setup:</strong> Ensure your Supabase tables are created with the provided schema
            </p>
            <p>
              <strong>4. Deploy:</strong> Deploy this modal to Vercel for production use
            </p>
          </div>
        </div>
      </div>

      {/* BidIt Modal */}
      <BidItModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shopifyProductId={sampleProduct.id}
        productTitle={sampleProduct.title}
        productPrice={sampleProduct.price}
        userId="1" // Demo user ID
      />
    </div>
  )
} 