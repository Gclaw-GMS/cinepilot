export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-cinepilot-dark">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-cinepilot-card border-r border-cinepilot-border p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cinepilot-accent to-purple-500 bg-clip-text text-transparent">
            CinePilot
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI-Powered Pre-Production</p>
        </div>
        
        <nav className="space-y-1">
          <NavLink href="/dashboard" icon="📊">Dashboard</NavLink>
          <NavLink href="/" icon="📁">Projects</NavLink>
          <NavLink href="/scripts" icon="📝">Scripts</NavLink>
          <NavLink href="/schedule" icon="📅">Schedule</NavLink>
          <NavLink href="/budget" icon="💰">Budget</NavLink>
          <NavLink href="/crew" icon="👥">Crew</NavLink>
          <NavLink href="/call-sheets" icon="📋">Call Sheets</NavLink>
          <NavLink href="/ai-tools" icon="🤖">AI Tools</NavLink>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
    >
      <span>{icon}</span>
      <span>{children}</span>
    </a>
  )
}
