import UserSidebar from "../User/comp";
import Header from "../User/header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Sidebar Section */}
      <div className="w-72 flex-none">
        <div className="h-full bg-white border-r border-slate-200">
          <UserSidebar />
        </div>
      </div>

      {/* Content Vertical Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Existing Dynamic Header */}
        <div className="flex-none">
          <Header />
        </div>

        {/* Main Fluid Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
