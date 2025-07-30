import React from 'react'
import { CheckCircle } from 'lucide-react'

const DemoComplete: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        {/* BidIt Logo */}
        <div className="mb-6">
          <img 
            src="https://res.cloudinary.com/stitchify/image/upload/v1752904305/yfyfurus7bwlxwizi9ub.png" 
            alt="BidIt" 
            className="h-12 mx-auto"
          />
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        {/* Main Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Demo Complete</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Thank you for trying BidIt! You've successfully completed the bidding journey.
          </p>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">What you experienced:</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Interactive bidding interface</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Real-time bid quality feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Counter-offer functionality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Seamless user journey tracking</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 rounded-xl text-base transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl text-base transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default DemoComplete 