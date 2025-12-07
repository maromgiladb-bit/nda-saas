'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ComingSoonPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/access-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Password correct - set cookie and redirect
        router.push('/');
        router.refresh();
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              FormalizeIt
            </h1>
            <p className="text-gray-500 text-sm">NDA Management Platform</p>
          </div>

          {/* Coming Soon Message */}
          <div className="text-center mb-8">
            <div className="inline-block bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🚀 Launching Soon
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              We're Almost Ready!
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our platform is currently in final development. We're putting the finishing touches 
              to bring you the best NDA management experience.
            </p>
          </div>

          {/* Password Form */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Have early access? Enter your password below.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Access Platform'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-gray-500">
              Want early access? Contact us at{' '}
              <a href="mailto:hello@formalizeit.com" className="text-teal-600 hover:underline">
                hello@formalizeit.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
