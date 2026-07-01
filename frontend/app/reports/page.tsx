"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";

type Reports = {
  leadConversionReport: {
    totalLeads: number;
    convertedLeads: number;
    lostLeads: number;
    conversionRate: number;
  };
  salesPerformanceReport: {
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    winRate: number;
  };
  revenueReport: { revenue: number };
  activityReport: { totalActivities: number };
  userProductivityReport: { totalUsers: number };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null);

  useEffect(() => {
    apiFetch("/reports").then(setReports);
  }, []);

  if (!reports) return <p>Loading reports...</p>;

  const rows = [
    ["Lead Conversion", "Total Leads", reports.leadConversionReport.totalLeads],
    ["Lead Conversion", "Converted Leads", reports.leadConversionReport.convertedLeads],
    ["Lead Conversion", "Lost Leads", reports.leadConversionReport.lostLeads],
    ["Lead Conversion", "Conversion Rate", `${reports.leadConversionReport.conversionRate}%`],
    ["Sales Performance", "Total Deals", reports.salesPerformanceReport.totalDeals],
    ["Sales Performance", "Won Deals", reports.salesPerformanceReport.wonDeals],
    ["Sales Performance", "Lost Deals", reports.salesPerformanceReport.lostDeals],
    ["Sales Performance", "Win Rate", `${reports.salesPerformanceReport.winRate}%`],
    ["Revenue", "Revenue", reports.revenueReport.revenue],
    ["Activity", "Total Activities", reports.activityReport.totalActivities],
    ["User Productivity", "Total Users", reports.userProductivityReport.totalUsers],
  ];

  function exportCSV() {
    const csv = [["Report", "Metric", "Value"], ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "crm-reports.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  }

  function exportExcel() {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Report", "Metric", "Value"],
      ...rows,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CRM Reports");
    XLSX.writeFile(workbook, "crm-reports.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();

    doc.text("CRM Reports", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Report", "Metric", "Value"]],
      body: rows,
    });

    doc.save("crm-reports.pdf");
  }

  const salesData = [
    { name: "Won", value: reports.salesPerformanceReport.wonDeals },
    { name: "Lost", value: reports.salesPerformanceReport.lostDeals },
  ];

  const leadData = [
    { name: "Converted", value: reports.leadConversionReport.convertedLeads },
    { name: "Lost", value: reports.leadConversionReport.lostLeads },
    { name: "Total", value: reports.leadConversionReport.totalLeads },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-slate-500">
            Sales, revenue, activity and productivity reports.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>CSV</Button>
          <Button variant="outline" onClick={exportExcel}>Excel</Button>
          <Button onClick={exportPDF}>PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reports.leadConversionReport.conversionRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reports.salesPerformanceReport.winRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">EUR {reports.revenueReport.revenue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reports.activityReport.totalActivities}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reports.userProductivityReport.totalUsers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 1, height: 320 }}
              >
                <BarChart data={salesData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 1, height: 320 }}
              >
                <PieChart>
                  <Pie
                    data={leadData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
