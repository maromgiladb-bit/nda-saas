export default function Plans() {
  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940]">

  {/* Main content (plans) */}
  <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
        {/* Headline and sub-headline */}
        <h1 className="text-3xl font-bold text-[#1a2940] mb-2 text-center">Simple pricing. Scales with your company.</h1>
        <p className="text-lg text-[#233366] mb-8 text-center">Start free, upgrade as you grow. All plans include secure NDA templates, negotiation, and e-signatures.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Pro Plan */}
          <div className="bg-white border border-[#2563eb] rounded-xl p-8 shadow-md flex flex-col items-center">
            <h2 className="text-2xl font-bold text-[#2563eb] mb-2">Pro <span className="text-xs bg-[#2563eb] text-white px-2 py-1 rounded ml-2">Most Popular</span></h2>
            <ul className="text-[#233366] text-base mb-6 space-y-2 text-left w-full max-w-xs">
              <li>✅ Up to 10 users</li>
              <li>✅ Unlimited NDAs</li>
              <li>✅ Track-changes negotiation</li>
              <li>✅ Relationship dashboard</li>
              <li>✅ Email reminders</li>
              <li>✅ Standard support</li>
            </ul>
            <div className="text-3xl font-bold text-[#1a2940] mb-2">$49 <span className="text-base font-normal">/ month per org</span></div>
            <button className="bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition">Buy Pro</button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white border border-[#1a2940] rounded-xl p-8 shadow-md flex flex-col items-center">
            <h2 className="text-2xl font-bold text-[#1a2940] mb-2">Enterprise</h2>
            <ul className="text-[#233366] text-base mb-6 space-y-2 text-left w-full max-w-xs">
              <li>✅ Unlimited users</li>
              <li>✅ Unlimited NDAs</li>
              <li>✅ Advanced template rules &amp; API access</li>
              <li>✅ Audit log exports</li>
              <li>✅ Dedicated account manager</li>
              <li>✅ SSO (Single Sign-On) &amp; security policies</li>
            </ul>
            <div className="text-xl font-bold text-[#1a2940] mb-2">Custom pricing</div>
            <button className="bg-[#233366] hover:bg-[#1a2940] text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition">Contact Sales</button>
          </div>
        </div>

        {/* Bottom call-to-action */}
        <div className="w-full flex flex-col items-center mt-12">
          <p className="text-lg text-[#233366] text-center mb-4">Don’t let NDAs slow you down. Choose a plan and start today.</p>
          <div className="flex gap-4">
            <button className="bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition">Start Free Trial</button>
            <button className="bg-[#233366] hover:bg-[#1a2940] text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition">Contact Sales</button>
          </div>
        </div>
      </main>
    </div>
  );
}