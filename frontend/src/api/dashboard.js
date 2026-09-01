import { apiRequest } from './client'

<<<<<<< HEAD
export const getOrganizationDashboard = () => apiRequest('/dashboard/organization')
export const getEmployeeDashboard = () => apiRequest('/dashboard/employee')
=======
export async function getOverview() {
  const response = await apiRequest('/overview')
  return response.data
}

export const getOrganizationDashboard = getOverview
export const getEmployeeDashboard = getOverview
>>>>>>> poshika/final-integration
