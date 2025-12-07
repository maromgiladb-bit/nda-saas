'use client';

import { SignInButton } from '@clerk/nextjs';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#001f3f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '-10%', left: '-10%', animationDuration: '4s' }}></div>
        <div className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ bottom: '-10%', right: '-10%', animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute w-64 h-64 bg-blue-300/10 rounded-full blur-2xl animate-pulse" style={{ top: '40%', right: '20%', animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Animated dots */}
        <div className="flex justify-center items-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.4s' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}></div>
        </div>

        {/* Coming Soon text with fade-in animation */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in tracking-tight">
          FormalizeIt – Coming Soon
        </h1>

        <p className="text-blue-100/80 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          The platform is currently in private testing.
        </p>

        {/* Animated underline */}
        <div className="flex justify-center mb-12">
          <div className="h-1 w-32 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
        </div>

        {/* Sign in button */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md mx-auto">
          <p className="text-white/80 text-lg mb-6">
            Sign in to access the platform
          </p>
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-500/50">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}
