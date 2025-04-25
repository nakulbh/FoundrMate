import React from 'react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 p-6 w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
      </header>

      <section className="space-y-6">
        {/* Subscription Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-medium text-lg text-gray-800 dark:text-white mb-3">Subscription</h2>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">Free</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Basic access</span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Upgrade
            </button>
          </div>
        </div>

        {/* Credits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-medium text-lg text-gray-800 dark:text-white mb-3">Credits</h2>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-800 dark:text-white">0</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">credits available</span>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Buy Credits
            </button>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-medium text-lg text-gray-800 dark:text-white mb-3">Language</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">English (US)</span>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
              Change
            </button>
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-medium text-lg text-gray-800 dark:text-white mb-3">Theme</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Light</span>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
              Change
            </button>
          </div>
        </div>

        {/* Linked Accounts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-medium text-lg text-gray-800 dark:text-white mb-3">Linked Accounts</h2>
          <div className="text-center py-3">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No accounts linked</p>
            <button className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
              Connect Account
            </button>
          </div>
        </div>
        
        {/* Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-medium text-lg text-gray-800 dark:text-white mb-3">Account</h2>
          <div className="flex justify-end">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="border border-red-300 dark:border-red-800 rounded-lg p-4">
          <h2 className="font-medium text-lg text-red-600 dark:text-red-400 mb-3">Danger Zone</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Permanently delete your account and all data</span>
            <button className="bg-white text-red-600 border border-red-600 hover:bg-red-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
