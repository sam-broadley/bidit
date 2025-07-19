import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import BidItModal from '@/components/BidItModal'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 1,
              shopify_product_id: 'gid://shopify/Product/123456789',
              title: 'Test Product',
              price: 100,
              bidit_enabled: true,
              min_discount_percent: 10,
              max_discount_percent: 25
            }
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 1 }
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve())
      }))
    }))
  }
}))

describe('BidItModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    shopifyProductId: 'gid://shopify/Product/123456789',
    productTitle: 'Test Product',
    productPrice: 100,
    userId: '1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders modal when open', () => {
    render(<BidItModal {...defaultProps} />)
    
    expect(screen.getByText('BidIt - Make an Offer')).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('shows product information step initially', () => {
    render(<BidItModal {...defaultProps} />)
    
    expect(screen.getByText('Full price')).toBeInTheDocument()
    expect(screen.getByText('You have 2 bids remaining')).toBeInTheDocument()
    expect(screen.getByText('Start Bidding')).toBeInTheDocument()
  })

  it('shows how BidIt works information', () => {
    render(<BidItModal {...defaultProps} />)
    
    expect(screen.getByText('How BidIt works')).toBeInTheDocument()
    expect(screen.getByText(/You're bidding against the merchant/)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<BidItModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('BidIt - Make an Offer')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<BidItModal {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
}) 