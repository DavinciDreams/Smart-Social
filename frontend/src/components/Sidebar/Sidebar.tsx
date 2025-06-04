import { SidebarProps } from '@types/index'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Bookmark,
    ChevronLeft,
    ChevronRight,
    Filter,
    Home,
    Network,
    Settings,
    Star,
    TrendingUp,
    Users
} from 'lucide-react'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { name: 'Feed', href: '/', icon: Home, count: null },
  { name: 'Knowledge Graph', href: '/graph', icon: Network, count: null },
  { name: 'Recommendations', href: '/recommendations', icon: Star, count: 12 },
  { name: 'Saved Items', href: '/saved', icon: Bookmark, count: 34 },
  { name: 'Trending', href: '/trending', icon: TrendingUp, count: null },
  { name: 'Sources', href: '/sources', icon: Users, count: 8 },
  { name: 'Settings', href: '/settings', icon: Settings, count: null },
]

const filters = [
  { name: 'High Quality', active: true, color: 'bg-green-500' },
  { name: 'Technical', active: true, color: 'bg-blue-500' },
  { name: 'Recent', active: false, color: 'bg-purple-500' },
  { name: 'Popular', active: false, color: 'bg-orange-500' },
]

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation()
  const [activeFilters, setActiveFilters] = useState(
    filters.map(f => ({ ...f }))
  )

  const toggleFilter = (index: number) => {
    setActiveFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, active: !filter.active } : filter
      )
    )
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative bg-white border-r border-gray-200 flex flex-col h-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Smart Social
                </h1>
                <p className="text-xs text-gray-500">AI Content Curation</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Navigation
              </h3>
            </motion.div>
          )}
        </AnimatePresence>

        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 text-primary-700 shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon 
                className={`
                  ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} 
                  ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                  transition-colors
                `} 
              />
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 flex items-center justify-between flex-1"
                  >
                    <span>{item.name}</span>
                    {item.count && (
                      <span className={`
                        px-2 py-1 text-xs rounded-full
                        ${isActive 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {item.count}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          )
        })}

        {/* Quick Filters */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-6 mt-6 border-t border-gray-200"
            >
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Filters
              </h3>
              
              <div className="space-y-2">
                {activeFilters.map((filter, index) => (
                  <button
                    key={filter.name}
                    onClick={() => toggleFilter(index)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all
                      ${filter.active 
                        ? 'bg-gray-50 text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${filter.color} ${filter.active ? 'opacity-100' : 'opacity-40'}`} />
                      <span>{filter.name}</span>
                    </div>
                    <div className={`
                      w-4 h-4 rounded border transition-all
                      ${filter.active 
                        ? 'bg-primary-600 border-primary-600' 
                        : 'border-gray-300'
                      }
                    `}>
                      {filter.active && (
                        <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 border-t border-gray-200"
          >
            <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    AI Status
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    Filtering content...
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Quality Score</span>
                  <span>94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
