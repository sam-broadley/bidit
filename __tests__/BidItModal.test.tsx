import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn()
        }))
      }))
    }))
  },
  Product: {},
  Bid: {},
  BidLog: {}
}))

jest.mock('@vercel/analytics', () => ({
  track: jest.fn()
}))

jest.mock('@/lib/utils', () => ({
  decodeHtmlEntities: jest.fn((str) => str),
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
})

describe('Cookie Utility Functions', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = ''
    jest.clearAllMocks()
  })

  it('should handle cookie utility functions correctly', () => {
    // Test the cookie utility functions directly
    const setCookie = (name: string, value: string, days: number = 365) => {
      const expires = new Date()
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    }

    const getCookie = (name: string): string | null => {
      const nameEQ = name + "="
      const ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }
      return null
    }

    const deleteCookie = (name: string) => {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
    }

    // Test setting cookies
    setCookie('test_name', 'Test User')
    expect(getCookie('test_name')).toBe('Test User')

    // Test setting multiple cookies
    setCookie('test_email', 'test@example.com')
    expect(getCookie('test_email')).toBe('test@example.com')

    // Test deleting cookies
    deleteCookie('test_name')
    expect(getCookie('test_name')).toBeNull()

    // Test that other cookies remain
    expect(getCookie('test_email')).toBe('test@example.com')
  })

  it('should handle user data cookies correctly', () => {
    const setCookie = (name: string, value: string, days: number = 365) => {
      const expires = new Date()
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    }

    const getCookie = (name: string): string | null => {
      const nameEQ = name + "="
      const ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }
      return null
    }

    const deleteCookie = (name: string) => {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
    }

    // Test setting user data cookies
    setCookie('bidit_first_name', 'John')
    setCookie('bidit_last_name', 'Doe')
    setCookie('bidit_email', 'john@example.com')

    // Verify cookies were set
    expect(getCookie('bidit_first_name')).toBe('John')
    expect(getCookie('bidit_last_name')).toBe('Doe')
    expect(getCookie('bidit_email')).toBe('john@example.com')

    // Test clearing user data cookies
    deleteCookie('bidit_first_name')
    deleteCookie('bidit_last_name')
    deleteCookie('bidit_email')

    // Verify cookies were cleared
    expect(getCookie('bidit_first_name')).toBeNull()
    expect(getCookie('bidit_last_name')).toBeNull()
    expect(getCookie('bidit_email')).toBeNull()
  })
}) 