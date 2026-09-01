import { apiRequest } from './client'

export async function getOverview() {
  const response = await apiRequest('/overview')
  return response.data
}

export const getOrganizationDashboard = getOverview
export const getEmployeeDashboard = getOverview
