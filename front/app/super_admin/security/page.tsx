"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ================= MOCK SERVER DATA =================

type LogLevel = "info" | "warning" | "error" | "critical";
type LogType =
  | "LOGIN"
  | "SERVER"
  | "SECURITY"
  | "ADMIN"
  | "2FA";

interface LogItem {
  id: number;
  type: LogType;
  level: LogLevel;
  message: string;
  ip: string;
  user: string;
  date: string;
}

const initialLogs: LogItem[] = [
  {
    id: 1,
    type: "LOGIN",
    level: "warning",
    message: "Failed login attempt",
    ip: "192.168.1.15",
    user: "unknown",
    date: "2026-02-12 09:15",
  },
  {
    id: 2,
    type: "SERVER",
    level: "error",
    message: "500 error on /api/workflows",
    ip: "internal",
    user: "system",
    date: "2026-02-12 08:42",
  },
  {
    id: 3,
    type: "SECURITY",
    level: "critical",
    message: "Multiple password reset attempts",
    ip: "88.45.22.11",
    user: "client_admin",
    date: "2026-02-11 22:10",
  },
  {
    id: 4,
    type: "ADMIN",
    level: "info",
    message: "Company plan upgraded (Starter → Pro)",
    ip: "10.0.0.2",
    user: "super_admin",
    date: "2026-02-11 16:30",
  },
  {
    id: 5,
    type: "2FA",
    level: "warning",
    message: "2FA failed attempt",
    ip: "41.90.12.8",
    user: "finance_admin",
    date: "2026-02-11 14:02",
  },
];

const loginAttemptsData = [
  { day: "Mon", attempts: 120 },
  { day: "Tue", attempts: 98 },
  { day: "Wed", attempts: 140 },
  { day: "Thu", attempts: 110 },
  { day: "Fri", attempts: 160 },
  { day: "Sat", attempts: 70 },
  { day: "Sun", attempts: 90 },
];

// ================= COMPONENT =================

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 3; // simulate server pagination

  // ================= REAL-TIME SIMULATION (WebSocket mock) =================
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogItem = {
        id: Date.now(),
        type: "LOGIN",
        level: "warning",
        message: "Real-time login attempt detected",
        ip: "203.0.113.1",
        user: "unknown",
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      setLogs((prev) => [newLog, ...prev]);
    }, 20000); // every 20s

    return () => clearInterval(interval);
  }, []);

  // ================= FILTERING =================
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) =>
        log.message.toLowerCase().includes(search.toLowerCase())
      )
      .filter((log) => (levelFilter === "all" ? true : log.level === levelFilter))
      .filter((log) => (typeFilter === "all" ? true : log.type === typeFilter));
  }, [logs, search, levelFilter, typeFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ================= CSV EXPORT =================
  const exportCSV = () => {
    const headers = "Type,Level,Message,IP,User,Date\n";
    const rows = filteredLogs
      .map(
        (l) =>
          `${l.type},${l.level},${l.message},${l.ip},${l.user},${l.date}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security_logs.csv";
    a.click();
  };

  const getBadgeVariant = (level: LogLevel) => {
    if (level === "critical" || level === "error") return "destructive";
    if (level === "warning") return "secondary";
    return "default";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Security & Audit Center</h1>
          <p className="text-gray-500">
            Enterprise monitoring, audit trail, RBAC tracking & 2FA events
          </p>
        </div>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* LOGIN ATTEMPTS CHART */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Weekly Login Attempts</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loginAttemptsData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="attempts" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* FILTERS */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select onValueChange={(v) => setLevelFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setTypeFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="SERVER">Server</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="2FA">2FA</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* AUDIT LOG TABLE */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-semibold">Audit Trail</h3>

          {paginatedLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 rounded-xl bg-gray-100 text-sm"
            >
              <div>
                <p className="font-medium">{log.type}</p>
                <p className="text-xs text-gray-500">{log.date}</p>
              </div>
              <div>{log.message}</div>
              <div>IP: {log.ip}</div>
              <div>User: {log.user}</div>
              <div>
                <Badge variant={getBadgeVariant(log.level)}>
                  {log.level.toUpperCase()}
                </Badge>
              </div>
            </motion.div>
          ))}

          {/* PAGINATION */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
