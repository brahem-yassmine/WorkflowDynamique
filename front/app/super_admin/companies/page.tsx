"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";

type Company = {
  id: string;
  name: string;
  plan: string;
  users: number;
  registrationDate: string;
  adminName: string;
  email: string;
  status: string;
  databaseName: string;
};

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // ✅ Charger les entreprises avec débogage
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("=".repeat(50));
      console.log("📋 ÉTAPE 1: Début chargement entreprises");
      
      const token = localStorage.getItem('auth_token');
      console.log("📋 ÉTAPE 2: Token présent:", token ? "Oui" : "Non");
      
      if (!token) {
        setError("Token non trouvé - Veuillez vous reconnecter");
        alert("Veuillez vous reconnecter");
        return;
      }

      console.log("📋 ÉTAPE 3: Envoi requête à /api/admin/tenants");
      
      const response = await fetch('http://localhost:5000/api/admin/tenants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📋 ÉTAPE 4: Status réponse:", response.status);
      console.log("📋 ÉTAPE 4b: Status texte:", response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Réponse erreur:", errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📋 ÉTAPE 5: Données reçues:", data);
      
      console.log("📋 ÉTAPE 6: success:", data.success);
      console.log("📋 ÉTAPE 7: data.data type:", typeof data.data);
      console.log("📋 ÉTAPE 8: data.data est un tableau?", Array.isArray(data.data));
      
      if (data.success && Array.isArray(data.data)) {
        console.log("📋 ÉTAPE 9: Nombre de tenants:", data.data.length);
        
        if (data.data.length === 0) {
          console.log("⚠️ Aucun tenant trouvé dans la base");
          setCompanies([]);
          return;
        }
        
        // Afficher le premier tenant pour voir sa structure
        console.log("📋 ÉTAPE 10: Structure premier tenant:", JSON.stringify(data.data[0], null, 2));
        
        const formattedCompanies: Company[] = data.data.map((tenant: any, index: number) => {
          console.log(`📋 Mapping tenant ${index + 1}:`, tenant._id);
          
          return {
            id: tenant._id || '',
            name: tenant.name || 'Sans nom',
            plan: tenant.selectedPlan?.name || tenant.planDetails?.name || 'Non défini',
            users: tenant.userCount || 0,
            registrationDate: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue',
            adminName: tenant.adminName || (tenant.email ? tenant.email.split('@')[0] : 'Admin'),
            email: tenant.email || 'Email inconnu',
            status: tenant.status || 'inactif',
            databaseName: tenant.databaseName || 'N/A'
          };
        });
        
        console.log("📋 ÉTAPE 11: Entreprises formatées:", formattedCompanies);
        setCompanies(formattedCompanies);
        
        if (formattedCompanies.length > 0) {
          console.log("✅ Succès: Entreprises chargées:", formattedCompanies.length);
        } else {
          console.log("⚠️ Aucune entreprise formatée");
        }
      } else {
        console.error("❌ Format de réponse invalide:", data);
        setError("Format de données invalide reçu du serveur");
        alert("Erreur: Format de données invalide");
      }
      
    } catch (error) {
      console.error("❌ Erreur détaillée:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      alert(`Impossible de charger les entreprises: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      console.log("📋 ÉTAPE FINALE: Fin du chargement");
      setLoading(false);
    }
  };

  // ✅ Mettre à jour une entreprise
  const updateCompany = async () => {
    if (!selectedCompany) return;

    try {
      setUpdating(true);
      console.log("📝 Mise à jour entreprise:", selectedCompany);
      
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:5000/api/admin/tenants/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedCompany.name,
          email: selectedCompany.email,
          adminName: selectedCompany.adminName,
          status: selectedCompany.status
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Mise à jour réussie");
        alert("Entreprise mise à jour avec succès");
        
        setCompanies(prev =>
          prev.map(c => c.id === selectedCompany.id ? selectedCompany : c)
        );
        
        setOpen(false);
      } else {
        throw new Error(data.message || 'Erreur mise à jour');
      }
    } catch (error) {
      console.error("❌ Erreur mise à jour:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Changer le statut
  const toggleCompanyStatus = async (companyId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      console.log(`🔄 Changement statut: ${currentStatus} -> ${newStatus}`);

      const response = await fetch(`http://localhost:5000/api/admin/tenants/${companyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        console.log("✅ Statut changé");
        alert(`Entreprise ${newStatus === 'active' ? 'réactivée' : 'suspendue'}`);
        fetchCompanies();
      } else {
        const error = await response.text();
        console.error("❌ Erreur API:", error);
        alert("Erreur lors du changement de statut");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("Impossible de changer le statut");
    }
  };

  // Charger au démarrage
  useEffect(() => {
    fetchCompanies();
  }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800"
    };
    
    const texts = {
      active: "Actif",
      suspended: "Suspendu",
      inactive: "Inactif"
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.inactive}>
        {texts[status as keyof typeof texts] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 p-8 space-y-8">
      {/* En-tête avec bouton de débogage */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Entreprises</h1>
          <p className="text-muted-foreground">
            {companies.length} entreprise(s) trouvée(s)
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2">
              Erreur: {error}
            </p>
          )}
        </div>
        <div className="space-x-2">
          <Button 
            onClick={() => {
              console.log("🔍 Vérification manuelle...");
              console.log("Token:", localStorage.getItem('auth_token'));
              console.log("User:", localStorage.getItem('user'));
              fetchCompanies();
            }} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total entreprises</p>
            <p className="text-2xl font-bold">{companies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold text-green-600">
              {companies.filter(c => c.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Suspendues</p>
            <p className="text-2xl font-bold text-yellow-600">
              {companies.filter(c => c.status === 'suspended').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les entreprises</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.plan}</Badge>
                  </TableCell>
                  <TableCell>{company.users}</TableCell>
                  <TableCell>{company.registrationDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={company.status} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCompany(company);
                        setOpen(true);
                      }}
                    >
                      Détails
                    </Button>
                    <Button
                      size="sm"
                      variant={company.status === 'active' ? 'outline' : 'default'}
                      onClick={() => toggleCompanyStatus(company.id, company.status)}
                    >
                      {company.status === 'active' ? 'Suspendre' : 'Réactiver'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {companies.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-gray-500">Aucune entreprise trouvée</p>
                    <Button 
                      onClick={fetchCompanies} 
                      variant="link" 
                      className="mt-2"
                    >
                      Rafraîchir
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Détails de l'entreprise</DialogTitle>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={selectedCompany.name}
                  onChange={(e) =>
                    setSelectedCompany({
                      ...selectedCompany,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={selectedCompany.email}
                  onChange={(e) =>
                    setSelectedCompany({
                      ...selectedCompany,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Admin</label>
                <Input
                  value={selectedCompany.adminName}
                  onChange={(e) =>
                    setSelectedCompany({
                      ...selectedCompany,
                      adminName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={selectedCompany.status}
                  onValueChange={(value) =>
                    setSelectedCompany({
                      ...selectedCompany,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Base: {selectedCompany.databaseName}</p>
                <p>Inscription: {selectedCompany.registrationDate}</p>
                <p>Utilisateurs: {selectedCompany.users}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={updateCompany} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}