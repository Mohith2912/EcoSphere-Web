import { apiRequest } from './client'

export const getOrganizationDashboard = () => apiRequest('/dashboard/organization')
export const getEmployeeDashboard = () => apiRequest('/dashboard/employee')
