import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import OrganizationDashboard from './pages/organization/OrganizationDashboard'
import EmployeeHome from './pages/employee/EmployeeHome'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/org/dashboard" element={<OrganizationDashboard />} />
      <Route path="/app/dashboard" element={<EmployeeHome />} />
      <Route path="/org/:section" element={<PlaceholderPage experience="organization" />} />
      <Route path="/app/:section" element={<PlaceholderPage experience="employee" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
