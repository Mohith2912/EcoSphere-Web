import { apiRequest } from './client'

export async function login(credentials) {
<<<<<<< HEAD
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
=======
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return response.data
}

export async function getCurrentUser() {
  const response = await apiRequest('/auth/me')
  return response.data
>>>>>>> poshika/final-integration
}
