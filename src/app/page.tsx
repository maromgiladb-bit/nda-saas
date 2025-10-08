import Link from "next/link";
import PublicToolbar from "@/components/PublicToolbar";

export default function Home() {
  return (
    <div>
      <PublicToolbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Create NDAs in
              <span className="text-blue-600"> Minutes</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stop wasting time on legal paperwork. Our streamlined platform lets you generate, 
              customize, and sign NDAs instantly with our trusted template.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/plans">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg">
                  Choose Your Plan
                </button>
              </Link>
              <Link href="/about">
                <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-8 rounded-lg text-lg transition-colors">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Why Choose Our NDA Platform?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600">
                  Generate professional NDAs in minutes, not days. No more back-and-forth with lawyers.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Trusted</h3>
                <p className="text-gray-600">
                  Our legally vetted template ensures your confidential information stays protected.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Quality</h3>
                <p className="text-gray-600">
                  Get industry-standard NDAs that work for any business relationship or partnership.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Fill the Details</h3>
                <p className="text-gray-600">
                  Enter the key information: your company name, counterparty, and specific terms.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Preview & Customize</h3>
                <p className="text-gray-600">
                  Review the generated NDA and make any necessary adjustments before finalizing.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Send & Sign</h3>
                <p className="text-gray-600">
                  Download the final document or send it directly to the other party for signing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Streamline Your NDAs?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of businesses who trust our platform for their confidentiality agreements.
            </p>
            <Link href="/plans">
              <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg">
                Choose Your Plan
              </button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400">
              © 2025 CONFIDO. All rights reserved. | 
              <Link href="/about" className="hover:text-white ml-2">About</Link> | 
              <Link href="/contact" className="hover:text-white ml-2">Contact</Link> | 
              <Link href="/plans" className="hover:text-white ml-2">Plans</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
