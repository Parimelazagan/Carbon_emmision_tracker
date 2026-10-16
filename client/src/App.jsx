import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import AppLayout from './components/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Auth Pages
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'

// Dashboard & Data Pages
import DashboardPage from './pages/DashboardPage.jsx'
import ConsumptionPage from './pages/ConsumptionPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import FacilitiesPage from './pages/FacilitiesPage.jsx'
import FacilityDetailPage from './pages/FacilityDetailPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import EmissionFactorsPage from './pages/EmissionFactorsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consumption"
              element={
                <ProtectedRoute>
                  <ConsumptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities"
              element={
                <ProtectedRoute>
                  <FacilitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities/:id"
              element={
                <ProtectedRoute>
                  <FacilityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emission-factors"
              element={
                <ProtectedRoute>
                  <EmissionFactorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
