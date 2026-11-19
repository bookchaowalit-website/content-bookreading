import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '../page'

vi.mock('@/providers/ThemeProvider', () => ({ useTheme: () => ({ darkMode: false, toggleDarkMode: vi.fn() }) }))

// UX review 2026-11-18: truthful claims, correct plan links, hub link and current copyright year.
describe('landing page', () => {
  it('shows no invented usage numbers or superlatives', () => {
    const { container } = render(<LandingPage />)
    const text = container.textContent ?? ''
    for (const claim of ['10K+', '1M+', '50+', 'ดีที่สุด']) expect(text).not.toContain(claim)
  })

  it('labels the hero translation as an example', () => {
    render(<LandingPage />)
    expect(screen.getByText(/ตัวอย่างการแปล/)).toBeInTheDocument()
  })

  it('sends the team plan to the contact page and the others to sign-up', () => {
    render(<LandingPage />)
    expect(screen.getByRole('link', { name: 'ติดต่อเรา' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'เริ่มต้นฟรี' })).toHaveAttribute('href', '/register')
  })

  it('links back to the hub and shows the current year', () => {
    const { container } = render(<LandingPage />)
    const hub = screen.getAllByRole('link', { name: 'bookchaowalit.com' })
    expect(hub.length).toBeGreaterThan(0)
    hub.forEach((a) => expect(a).toHaveAttribute('href', 'https://bookchaowalit.com'))
    expect(container.textContent).toContain(`© ${new Date().getFullYear()} BookReading`)
  })
})
