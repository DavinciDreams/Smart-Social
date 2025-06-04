import { Header } from '@components/Layout/Header'
import { Sidebar } from '@components/Sidebar/Sidebar'
import { ErrorBoundary } from '@components/UI/ErrorBoundary'
import { LoadingSpinner } from '@components/UI/LoadingSpinner'
import { motion } from 'framer-motion'
import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@/pages/HomePage'))
const GraphPage = React.lazy(() => import('@/pages/GraphPage'))
const RecommendationsPage = React.lazy(() => import('@/pages/RecommendationsPage'))
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'))

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ErrorBoundary>
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/graph" element={<GraphPage />} />
                  <Route path="/recommendations" element={<RecommendationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Suspense>
            </motion.div>
          </main>
        </div>
      </ErrorBoundary>
    </div>
  )
}

export default App
