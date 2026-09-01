<<<<<<< HEAD
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
=======
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
>>>>>>> poshika/final-integration

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest(path, options = {}) {
  const token = window.localStorage.getItem('ecosphere_access_token')
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
<<<<<<< HEAD
    throw new ApiError(payload?.message || 'The request could not be completed.', response.status, payload)
=======
    throw new ApiError(payload?.error?.message || payload?.message || 'The request could not be completed.', response.status, payload?.error || payload)
>>>>>>> poshika/final-integration
  }

  return payload
}
