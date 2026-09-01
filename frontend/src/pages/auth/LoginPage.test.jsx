// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import { login } from '../../api/auth'

vi.mock('../../api/auth', () => ({ login: vi.fn() }))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/dashboard" element={<h1>Employee dashboard</h1>} />
        <Route path="/org/dashboard" element={<h1>Organization dashboard</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('retains typed credentials, submits them, stores the JWT, and follows the verified route', async () => {
    login.mockResolvedValue({ accessToken: 'test-token', defaultRoute: '/app/dashboard' })
    const user = userEvent.setup()
    renderLogin()
    const email = screen.getByRole('textbox', { name: 'Organization email' })
    const password = screen.getByPlaceholderText('Enter your password')
    await user.type(email, ' Employee@EcoSphere.Local ')
    await user.type(password, 'Employee@1234')
    expect(email.value).toBe('Employee@EcoSphere.Local')
    expect(password.value).toBe('Employee@1234')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))
    expect(await screen.findByRole('heading', { name: 'Employee dashboard' })).toBeTruthy()
    expect(login).toHaveBeenCalledWith({ email: 'employee@ecosphere.local', password: 'Employee@1234' })
    expect(window.localStorage.getItem('ecosphere_access_token')).toBe('test-token')
  })

  it('shows API errors and keeps the user on login', async () => {
    login.mockRejectedValue(new Error('Invalid email, password, or organization.'))
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByRole('textbox', { name: 'Organization email' }), 'admin@ecosphere.local')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'WrongPassword')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Invalid email, password, or organization.')
    expect(screen.getByRole('heading', { name: 'Sign in to your workspace' })).toBeTruthy()
  })

  it('toggles password visibility with an unambiguous accessible name', async () => {
    const user = userEvent.setup()
    renderLogin()
    const password = screen.getByPlaceholderText('Enter your password')
    expect(password.getAttribute('type')).toBe('password')
    await user.click(screen.getByRole('button', { name: 'Reveal entered secret' }))
    expect(password.getAttribute('type')).toBe('text')
    expect(screen.getByRole('button', { name: 'Mask entered secret' })).toBeTruthy()
  })
})
