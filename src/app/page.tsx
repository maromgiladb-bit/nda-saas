"use client";
import { useUser, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileText, CheckCircle, Shield, Users, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-element');
        }
      });
    }, observerOptions);

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (statsRef.current) observer.observe(statsRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .fade-in-element {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .opacity-0 {
          opacity: 0;
        }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      <main>
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-800)] text-white overflow-hidden">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center">
              {mounted && (
                <>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
                    Create Professional NDAs
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                      Effortlessly
                    </span>
                  </h1>

                  <p className="mt-6 text-xl leading-8 text-gray-300 max-w-3xl mx-auto animate-fade-in-up delay-100">
                    Streamline your confidentiality agreements with our intuitive NDA creation platform.
                    Generate, customize, and manage NDAs with just a few clicks.
                  </p>

                  <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
                    <SignUpButton mode="modal">
                      <button className="group px-8 py-4 bg-[var(--teal-600)] text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-[var(--teal-700)] transition-all duration-200">
                        Get Started Free
                        <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </SignUpButton>
                    <button
                      onClick={() => router.push("/about")}
                      className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-lg font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      Learn More
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div ref={statsRef} className="opacity-0 bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[var(--teal-600)] transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl font-bold text-[var(--teal-600)] mb-2">10,000+</div>
                <div className="text-gray-600 font-semibold">NDAs Created</div>
              </div>
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[var(--teal-600)] transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl font-bold text-[var(--teal-600)] mb-2">99.9%</div>
                <div className="text-gray-600 font-semibold">Uptime</div>
              </div>
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[var(--teal-600)] transition-all duration-300 hover:shadow-lg">
                <div className="text-4xl font-bold text-[var(--teal-600)] mb-2">5,000+</div>
                <div className="text-gray-600 font-semibold">Happy Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div ref={featuresRef} className="opacity-0 py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for NDAs
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful features to streamline your confidentiality agreements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy Creation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create professional NDAs in minutes with our step-by-step wizard and pre-built templates.
                </p>
              </div>

              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Digital Signatures</h3>
                <p className="text-gray-600 leading-relaxed">
                  Send NDAs for electronic signatures and track signing status in real-time.
                </p>
              </div>

              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure & Compliant</h3>
                <p className="text-gray-600 leading-relaxed">
                  Bank-level security and legal compliance to protect your confidential information.
                </p>
              </div>

              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Collaboration</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share drafts with team members and collaborate on NDA creation seamlessly.
                </p>
              </div>

              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Status Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor NDA status from draft to signed with comprehensive tracking features.
                </p>
              </div>

              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[var(--teal-600)] transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600 leading-relaxed">
                  Quick turnaround times with automated workflows and instant notifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div ref={ctaRef} className="opacity-0 bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-800)] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to streamline your NDAs?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of businesses who trust our platform for their confidentiality agreements.
            </p>
            <SignUpButton mode="modal">
              <button className="group px-10 py-5 bg-[var(--teal-600)] text-white text-lg font-semibold rounded-lg shadow-xl hover:bg-[var(--teal-700)] transition-all duration-200">
                Start Creating NDAs Today
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </SignUpButton>
          </div>
        </div>
      </main>
    </div>
  );
}
