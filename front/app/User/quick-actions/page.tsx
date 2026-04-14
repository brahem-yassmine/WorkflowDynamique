import QuickActionsContent from './QuickActionsContent';

export default function QuickActionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Quick Actions</h1>
        <p className="text-slate-500">Launch business processes in seconds.</p>
      </div>
      
      <QuickActionsContent />
    </div>
  );
}
