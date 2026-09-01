import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import OrganizationDashboard from './pages/organization/OrganizationDashboard'
import EmployeeHome from './pages/employee/EmployeeHome'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
<<<<<<< HEAD
=======
  const protectedPage = (page) => window.localStorage.getItem('ecosphere_access_token') ? page : <Navigate to="/login" replace />
>>>>>>> poshika/final-integration
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
<<<<<<< HEAD
      <Route path="/org/dashboard" element={<OrganizationDashboard />} />
      <Route path="/app/dashboard" element={<EmployeeHome />} />
      <Route path="/org/:section" element={<PlaceholderPage experience="organization" />} />
      <Route path="/app/:section" element={<PlaceholderPage experience="employee" />} />
=======
      <Route path="/org/dashboard" element={protectedPage(<OrganizationDashboard />)} />
      <Route path="/app/dashboard" element={protectedPage(<EmployeeHome />)} />
      <Route path="/org/:section" element={protectedPage(<PlaceholderPage experience="organization" />)} />
      <Route path="/app/:section" element={protectedPage(<PlaceholderPage experience="employee" />)} />
>>>>>>> poshika/final-integration
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
