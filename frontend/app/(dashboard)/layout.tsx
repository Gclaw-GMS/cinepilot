export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Main Content */}
      <main className="">
        {children}
      </main>
    </div>
  )
}
