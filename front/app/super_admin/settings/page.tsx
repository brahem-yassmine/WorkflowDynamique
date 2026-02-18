"use client";

/**
 * PLATFORM SETTINGS PAGE (DESIGN ONLY)
 * -------------------------------------
 * This page is intentionally frontend-only.
 * Backend logic should be connected later via API routes.
 * 
 * Recommended backend structure:
 * - GET    /api/platform/settings        -> Fetch global settings
 * - PUT    /api/platform/settings        -> Update global settings
 * - POST   /api/platform/plans           -> Create new plan
 * - PUT    /api/platform/plans/:id       -> Update plan
 * - DELETE /api/platform/plans/:id       -> Delete plan
 * 
 * In production:
 * - Protect this route with RBAC (Super Admin only)
 * - Log all changes inside Audit Logs
 * - Add validation layer (Zod / Joi)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// ---------------- MOCK DATA ----------------

const initialPlans = [
  {
    id: 1,
    name: "Starter",
    price: 19,
    maxUsers: 10,
    maxWorkflows: 20,
    storage: "10GB",
    active: true,
  },
  {
    id: 2,
    name: "Pro",
    price: 49,
    maxUsers: 50,
    maxWorkflows: 100,
    storage: "100GB",
    active: true,
  },
];

export default function PlatformSettingsPage() {
  const [plans, setPlans] = useState(initialPlans);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformName, setPlatformName] = useState("Workflow SaaS");
  const [supportEmail, setSupportEmail] = useState("support@yourplatform.com");

  // ---------------- HANDLERS (FRONTEND ONLY) ----------------

  const handlePlanChange = (id: number, field: string, value: any) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, [field]: value } : plan
      )
    );

    /**
     * BACKEND IMPLEMENTATION GUIDE:
     * --------------------------------
     * 1. Call PUT /api/platform/plans/:id
     * 2. Validate input (price >= 0, limits > 0)
     * 3. Save changes in database
     * 4. Trigger audit log entry
     * 5. If price changed → sync with Stripe product
     */
  };

  const handleAddPlan = () => {
    const newPlan = {
      id: Date.now(),
      name: "New Plan",
      price: 0,
      maxUsers: 1,
      maxWorkflows: 1,
      storage: "1GB",
      active: false,
    };

    setPlans((prev) => [...prev, newPlan]);

    /**
     * BACKEND IMPLEMENTATION GUIDE:
     * --------------------------------
     * POST /api/platform/plans
     * - Create DB record
     * - Create Stripe product + price
     * - Return created plan
     */
  };

  const handleSavePlatformSettings = () => {
    /**
     * BACKEND IMPLEMENTATION GUIDE:
     * --------------------------------
     * PUT /api/platform/settings
     * Body:
     * {
     *   platformName,
     *   supportEmail,
     *   maintenanceMode
     * }
     * 
     * - Update global config table
     * - Clear cache if needed
     * - Log admin action
     */

    console.log("Save platform settings");
  };

  return (
    <div className="min-h-screen bg-muted/40 p-8 space-y-10">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Global configuration for pricing, plans and system behavior
        </p>
      </div>

      {/* GENERAL SETTINGS */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <Input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <Input
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Disable platform access for all users except Super Admin
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          <Button onClick={handleSavePlatformSettings}>
            Save General Settings
          </Button>
        </CardContent>
      </Card>

      {/* PLAN MANAGEMENT */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Plan Management</CardTitle>
          <Button onClick={handleAddPlan}>Add New Plan</Button>
        </CardHeader>

        <CardContent className="space-y-6">

          {plans.map((plan) => (
            <div
              key={plan.id}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 p-5 rounded-xl bg-muted/50 border"
            >
              <Input
                value={plan.name}
                onChange={(e) =>
                  handlePlanChange(plan.id, "name", e.target.value)
                }
              />

              <Input
                type="number"
                value={plan.price}
                onChange={(e) =>
                  handlePlanChange(plan.id, "price", Number(e.target.value))
                }
                placeholder="Price ($)"
              />

              <Input
                type="number"
                value={plan.maxUsers}
                onChange={(e) =>
                  handlePlanChange(plan.id, "maxUsers", Number(e.target.value))
                }
                placeholder="Max Users"
              />

              <Input
                type="number"
                value={plan.maxWorkflows}
                onChange={(e) =>
                  handlePlanChange(plan.id, "maxWorkflows", Number(e.target.value))
                }
                placeholder="Max Workflows"
              />

              <Input
                value={plan.storage}
                onChange={(e) =>
                  handlePlanChange(plan.id, "storage", e.target.value)
                }
                placeholder="Storage"
              />

              <div className="flex items-center justify-between">
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Active" : "Inactive"}
                </Badge>

                <Switch
                  checked={plan.active}
                  onCheckedChange={(value) =>
                    handlePlanChange(plan.id, "active", value)
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PLATFORM POLICY SECTION */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Platform Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Write platform usage rules or internal notes..." />

          {/**
           * BACKEND IDEA:
           * Store this content in database
           * Version it (audit trail)
           * Display on onboarding or dashboard
           */}
        </CardContent>
      </Card>
    </div>
  );
}
