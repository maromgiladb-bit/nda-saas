export default function Plans() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Simple, transparent pricing that works for you
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-600">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                10 NDAs per month
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic templates
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email support
              </li>
            </ul>
            <button className="w-full border-2 border-gray-900 text-gray-900 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-900 hover:text-white transition-colors">
              Get Started
            </button>
          </div>

          {/* Professional Plan */}
          <div className="bg-gray-900 rounded-lg p-8 relative transform scale-105 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Popular
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 mt-2">Professional</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$79</span>
              <span className="text-gray-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-300">
                <svg className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                50 NDAs per month
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom templates
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center text-gray-300">
                <svg className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Analytics dashboard
              </li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$199</span>
              <span className="text-gray-600">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited NDAs
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced templates
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 phone support
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom integrations
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Account manager
              </li>
            </ul>
            <button className="w-full border-2 border-gray-900 text-gray-900 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-900 hover:text-white transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
