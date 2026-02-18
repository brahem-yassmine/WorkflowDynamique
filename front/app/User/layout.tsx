import UserComp from "./comp";
import Header from "./header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid grid-cols-[280px_1fr] min-h-screen">

        {/* Sidebar: Navigation & Identity */}
        <aside className="bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
          
          
          <div className="flex-1 overflow-y-auto p-4">
             <UserComp /> 
          </div>

          
        </aside>

        {/* Right Zone: Header + Dynamic Content */}
        <div className="flex flex-col h-screen overflow-hidden">
          
          {/* Header: Actions & Breadcrumbs */}
          <Header />

          {/* Main Content: Scrollable Area */}
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}