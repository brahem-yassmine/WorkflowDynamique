// front/app/admin/quick-actions/page.tsx
import QuickActionsContent from '../../User/quick-actions/QuickActionsContent';

export default function AdminQuickActionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Quick Actions (Admin)</h1>
        <p className="text-slate-500">Execute business processes while staying in the administrative interface.</p>
      </div>
      
      <QuickActionsContent />
    </div>
  );
}
