"use client";
import Link from "next/link";

export default function Dashboard() {
  // ...existing code...
  // Mocked status counts
  const statusCards = [
    { label: "Drafts", count: 3, href: "/ndas?status=draft", icon: "📝" },
    { label: "Sent", count: 7, href: "/ndas?status=sent", icon: "📤" },
    { label: "Negotiating", count: 2, href: "/ndas?status=negotiating", icon: "🔄" },
    { label: "Signed", count: 12, href: "/ndas?status=signed", icon: "✅" },
    { label: "Archived", count: 5, href: "/ndas?status=archived", icon: "📦" },
  ];
  // Mocked recent activity
  const recentActivity = [
    { text: "NDA with Acme Inc. signed ✅", time: "Yesterday" },
    { text: "Draft with BetaCorp edited ✏️", time: "2 days ago" },
    { text: "Counterparty proposed changes to NDA with Gamma Ltd. 🔄", time: "3 days ago" },
    { text: "NDA with Delta LLC archived 📦", time: "4 days ago" },
    { text: "New NDA created for Epsilon GmbH 📝", time: "5 days ago" },
  ];
  // Quick actions
  const quickActions = [
    { label: "+ New NDA", href: "/ndas/new", color: "bg-[#2563eb] hover:bg-[#1e40af]" },
    { label: "Create NDA (dev)", href: "/createnda", color: "bg-green-600 hover:bg-green-700" },
    { label: "Fill NDA PDF", href: "/fillnda", color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "Manage Templates", href: "/templates", color: "bg-[#233366] hover:bg-[#1a2940]" },
    { label: "Invite Teammate", href: "/settings/users", color: "bg-[#3b82f6] hover:bg-[#60a5fa]" },
  ];

  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940]">
      
      {/* <PrivateToolbar /> Removed as per patch */}
      <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
        {/* Header */}
        <header className="mb-6 w-full text-center">
          <h1 className="text-3xl font-bold text-[#1a2940]">Dashboard</h1>
          <p className="text-lg text-[#233366] mt-2">Welcome back, here&apos;s what&apos;s happening with your NDAs</p>
        </header>
        {/* Status Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full max-w-5xl mb-8">
          {statusCards.map((card) => (
            <Link key={card.label} href={card.href} className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm hover:shadow-md transition flex flex-col items-center group">
              <span className="text-3xl mb-2">{card.icon}</span>
              <span className="text-2xl font-bold text-[#1a2940] group-hover:text-[#2563eb]">{card.count}</span>
              <span className="text-base text-[#233366] mt-1">{card.label}</span>
            </Link>
          ))}
        </section>
        {/* Recent Activity Feed */}
        <section className="w-full max-w-3xl mb-8">
          <h2 className="text-xl font-semibold text-[#1a2940] mb-4">Recent Activity</h2>
          <ul className="divide-y divide-[#e0e7ff] bg-[#f3f6fb] rounded-xl shadow-sm">
            {recentActivity.map((event, idx) => (
              <li key={idx} className="flex justify-between items-center px-6 py-4">
                <span className="text-base text-[#233366]">{event.text}</span>
                <span className="text-xs text-[#1a2940]">{event.time}</span>
              </li>
            ))}
          </ul>
        </section>
        {/* Quick Actions */}
        <section className="w-full max-w-3xl flex flex-col md:flex-row gap-4 justify-center items-center mt-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={`text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition ${action.color}`}>
              {action.label}
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
