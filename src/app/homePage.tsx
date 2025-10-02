"use client";
import Toolbar from "@/components/PublicToolbar";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940]">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-[#1a2940] text-white">
        {/* Left: Dropdown menu */}
        <div className="relative flex-1">
        <button
          className="px-4 py-2 rounded bg-[#233366] hover:bg-[#2d4373] font-medium text-sm flex items-center gap-2 transition text-white"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Toolbar />
          <span>Menu</span>
        </button>
        <button
          className="bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition mb-6"
          onClick={() => {
            window.location.href = "/plans";
          }}
        >
          Start a Free Trial
        </button>
        {/* Key Benefits section */}
        <section className="w-full flex flex-col items-center mt-2 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#1a2940] mb-2">Save Time</h3>
              <p className="text-base text-[#233366]">Stop rewriting the same NDA. Use templates and send instantly. Read only the relevant parts.</p>
            </div>
            <div className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#1a2940] mb-2">Negotiate Smarter</h3>
              <p className="text-base text-[#233366]">Counterparties can propose changes with track-changes, so review is simple.</p>
            </div>
            <div className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#1a2940] mb-2">Stay Secure</h3>
              <p className="text-base text-[#233366]">Every NDA is encrypted, logged, and safely stored.</p>
            </div>
          </div>
        </section>
        {/* How It Works section */}
        <section className="w-full flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold text-[#1a2940] text-center mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Choose a Template</h3>
              <p className="text-base text-[#233366]">Start with your standard NDA.</p>
            </div>
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Fill &amp; Send</h3>
              <p className="text-base text-[#233366]">Add names, dates, and details in seconds.</p>
            </div>
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Negotiate or Sign</h3>
              <p className="text-base text-[#233366]">Counterparty can suggest edits or sign immediately.</p>
            </div>
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Track Progress</h3>
              <p className="text-base text-[#233366]">See statuses, reminders, and a full audit trail.</p>
            </div>
          </div>
        </section>
        {/* ...removed Next.js logo and instructions... */}
      </main>
    </div>
  );
}
