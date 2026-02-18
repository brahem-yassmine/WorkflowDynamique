"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const plans = [
  {
    name: "Starter",
    maxUsers: 10,
    maxWorkflows: 20,
    storage: "10GB",
    monthlyRevenue: 2400,
    subscribers: 120,
  },
  {
    name: "Pro",
    maxUsers: 50,
    maxWorkflows: 100,
    storage: "100GB",
    monthlyRevenue: 8400,
    subscribers: 210,
  },
  {
    name: "Flow",
    maxUsers: 200,
    maxWorkflows: 500,
    storage: "1TB",
    monthlyRevenue: 15200,
    subscribers: 95,
  },
  {
    name: "Demo",
    maxUsers: 5,
    maxWorkflows: 5,
    storage: "2GB",
    monthlyRevenue: 0,
    subscribers: 60,
  },
];

const nearExpiration = [
  { company: "TechNova", daysLeft: 3 },
  { company: "HealthCorp", daysLeft: 5 },
  { company: "FinGroup", daysLeft: 2 },
];

export default function SubscriptionPaymentPage() {
  const [search, setSearch] = useState("");

  const totalRevenue = plans.reduce((acc, p) => acc + p.monthlyRevenue, 0);
  const totalSubscribers = plans.reduce((acc, p) => acc + p.subscribers, 0);
  const activeTrials = 34;

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Subscription & Payments</h1>
          <p className="text-gray-500">Global subscription management overview</p>
        </div>
        <Input
          placeholder="Search plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <p className="text-gray-500">Total Monthly Revenue</p>
            <h2 className="text-2xl font-bold mt-2">${totalRevenue.toLocaleString()}</h2>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <p className="text-gray-500">Total Subscribers</p>
            <h2 className="text-2xl font-bold mt-2">{totalSubscribers}</h2>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <p className="text-gray-500">Active Free Trials</p>
            <h2 className="text-2xl font-bold mt-2">{activeTrials}</h2>
          </CardContent>
        </Card>
      </div>

      {/* REVENUE CHART */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Monthly Revenue by Plan</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plans}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="monthlyRevenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* PLAN DETAILS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans
          .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
          .map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">{plan.name}</h4>
                    <Badge>{plan.subscribers} users</Badge>
                  </div>
                  <p className="text-sm text-gray-500">Max Users: {plan.maxUsers}</p>
                  <p className="text-sm text-gray-500">Max Workflows: {plan.maxWorkflows}</p>
                  <p className="text-sm text-gray-500">Storage: {plan.storage}</p>
                  <p className="font-medium">Revenue: ${plan.monthlyRevenue.toLocaleString()}</p>
                  <Button className="w-full mt-2">Edit Plan</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* NEAR EXPIRATION */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-semibold">Companies Near Expiration</h3>
          {nearExpiration.map((item) => (
            <div
              key={item.company}
              className="flex justify-between items-center p-3 rounded-xl bg-gray-100"
            >
              <span>{item.company}</span>
              <Badge variant="destructive">{item.daysLeft} days left</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
