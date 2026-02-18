"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

// Types pour les données
type DashboardStats = {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  totalRevenue: number;
  totalWorkflows: number;
  workflowExecutions: number;
  averageGpuUsage: number;
  trialCompanies: number;
  paidCompanies: number;
};

type SectorData = {
  sector: string;
  value: number;
};

type ModuleUsage = {
  name: string;
  value: number;
};

type RevenueData = {
  month: string;
  revenue: number;
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les données
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalWorkflows: 0,
    workflowExecutions: 0,
    averageGpuUsage: 0,
    trialCompanies: 0,
    paidCompanies: 0,
  });

  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [moduleUsage, setModuleUsage] = useState<ModuleUsage[]>([
    { name: "Workflow Automation", value: 0 },
    { name: "AI Processing", value: 0 },
    { name: "Data Analytics", value: 0 },
    { name: "Notifications", value: 0 },
  ]);
  
  const [revenueTrend, setRevenueTrend] = useState<RevenueData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Charger toutes les données
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      // 1. Récupérer tous les tenants
      console.log("📊 Chargement des données dashboard...");
      
      const tenantsResponse = await fetch('http://localhost:5000/api/admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!tenantsResponse.ok) {
        throw new Error('Erreur chargement tenants');
      }

      const tenantsData = await tenantsResponse.json();
      
      if (tenantsData.success && Array.isArray(tenantsData.data)) {
        const tenants = tenantsData.data;
        
        // Calculer les statistiques de base
        const activeCompanies = tenants.filter((t: any) => t.status === 'active').length;
        const suspendedCompanies = tenants.filter((t: any) => t.status === 'suspended').length;
        
        // Compter les utilisateurs total (à travers tous les tenants)
        let totalUsers = 0;
        const sectorCounts: Record<string, number> = {};
        const planCounts: Record<string, number> = {};
        
        for (const tenant of tenants) {
          totalUsers += tenant.userCount || 0;
          
          // Compter par secteur
          const sector = tenant.industry || 'Non spécifié';
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
          
          // Compter par plan
          const planName = tenant.selectedPlan?.name || tenant.planDetails?.name || 'Sans plan';
          planCounts[planName] = (planCounts[planName] || 0) + 1;
        }
        
        // Données par secteur
        const sectorDataArray = Object.entries(sectorCounts).map(([sector, value]) => ({
          sector,
          value
        }));
        
        // Données par plan
        const planDataArray = Object.entries(planCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        setSectorData(sectorDataArray);
        setPlanDistribution(planDataArray);
        
        // Statistiques globales
        setStats({
          totalCompanies: tenants.length,
          activeCompanies,
          suspendedCompanies,
          totalUsers,
          totalRevenue: 84250, // À calculer depuis les subscriptions
          totalWorkflows: 876, // À récupérer depuis les workflows
          workflowExecutions: 12450, // À récupérer depuis les instances
          averageGpuUsage: 68,
          trialCompanies: planCounts['Demo Plan'] || 0,
          paidCompanies: (planCounts['Starter Plan'] || 0) + (planCounts['Pro Plan'] || 0),
        });
      }

      // 2. Récupérer les données de revenus (simulées pour l'instant)
      const revenueData = [
        { month: "Jan", revenue: 12000 },
        { month: "Feb", revenue: 15000 },
        { month: "Mar", revenue: 18000 },
        { month: "Apr", revenue: 22000 },
        { month: "May", revenue: 17000 },
        { month: "Jun", revenue: 24000 },
      ];
      setRevenueTrend(revenueData);

    } catch (error) {
      console.error("❌ Erreur chargement dashboard:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/40 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 p-8 space-y-10">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Tableau de bord global - {stats.totalCompanies} entreprises
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Rafraîchir
        </button>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Entreprises" value={stats.totalCompanies} />
        <StatCard title="Actives" value={stats.activeCompanies} color="text-green-600" />
        <StatCard title="Suspendues" value={stats.suspendedCompanies} color="text-yellow-600" />
        <StatCard title="Utilisateurs" value={stats.totalUsers} />
        <StatCard title="Chiffre d'affaires" value={`${stats.totalRevenue} D`} />
        <StatCard title="Workflows" value={stats.totalWorkflows} />
        <StatCard title="Exécutions" value={stats.workflowExecutions} />
        <StatCard title="Utilisation GPU" value={`${stats.averageGpuUsage}%`} />
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-sm text-blue-600">En essai</p>
                <p className="text-2xl font-bold text-blue-700">{stats.trialCompanies}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-sm text-green-600">Payants</p>
                <p className="text-2xl font-bold text-green-700">{stats.paidCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution par plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTOR DISTRIBUTION */}
      {sectorData.length > 0 && (
        <DashboardCard title="Entreprises par secteur">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6">
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      )}

      {/* MODULE USAGE - À connecter avec les vraies données */}
      <DashboardCard title="Modules les plus utilisés">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={moduleUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* REVENUE TREND */}
      <DashboardCard title="Évolution du chiffre d'affaires (6 derniers mois)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </DashboardCard>

    </div>
  );
}

// Composants réutilisables
function StatCard({ title, value, color = "text-gray-900" }: { title: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}