"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const chartColors = ["#0f172a", "#2563eb", "#16a34a", "#f59e0b", "#dc2626"];

type DashboardStats = {
  totalLeads: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  tasksDueToday: number;
  revenueForecast: number;
  salesFunnel: { name: string; value: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  leadSources: { name: string; value: number }[];
  teamPerformance: { name: string; value: number }[];
};

const emptyStats: DashboardStats = {
  totalLeads: 0,
  activeDeals: 0,
  wonDeals: 0,
  lostDeals: 0,
  tasksDueToday: 0,
  revenueForecast: 0,
  salesFunnel: [],
  revenueByMonth: [],
  leadSources: [],
  teamPerformance: [],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    apiFetch("/dashboard/stats").then((data) => {
      setStats({
        ...emptyStats,
        ...data,
        salesFunnel: data.salesFunnel || [],
        revenueByMonth: data.revenueByMonth || [],
        leadSources: data.leadSources || [],
        teamPerformance: data.teamPerformance || [],
      });
    });
  }, []);

  if (!stats) {
    return <p>Loading dashboard...</p>;
  }

  const cards = [
    { title: "Total Leads", value: stats.totalLeads },
    { title: "Active Deals", value: stats.activeDeals },
    { title: "Won Deals", value: stats.wonDeals },
    { title: "Lost Deals", value: stats.lostDeals },
    { title: "Revenue Forecast", value: `EUR ${stats.revenueForecast}` },
    { title: "Tasks Due Today", value: stats.tasksDueToday },
  ];
  const maxFunnelValue = Math.max(
    ...stats.salesFunnel.map((stage) => stage.value),
    1
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500">
          Sales overview, revenue forecast, leads and team performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-xs text-green-600 mt-2">
                Updated from live CRM data
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByMonth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.leadSources}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {stats.leadSources.map((source, index) => (
                      <Cell
                        key={source.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.salesFunnel.map((stage) => (
              <div key={stage.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{stage.name}</span>
                  <span>{stage.value}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full">
                  <div
                    className="h-2 bg-slate-900 rounded-full"
                    style={{
                      width: `${(stage.value / maxFunnelValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.teamPerformance.map((member) => (
              <div
                key={member.name}
                className="flex justify-between border-b pb-2 last:border-b-0"
              >
                <span>{member.name}</span>
                <span className="font-semibold">{member.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
