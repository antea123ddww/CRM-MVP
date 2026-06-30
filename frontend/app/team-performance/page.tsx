"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TeamMemberPerformance = {
  id: string;
  name: string;
  email: string;
  role: string;
  ownedCompanies: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  taskCompletionRate: number;
  performanceScore: number;
};

export default function TeamPerformancePage() {
  const [rows, setRows] = useState<TeamMemberPerformance[]>([]);

  useEffect(() => {
    apiFetch("/team-performance").then(setRows);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Performance</h1>
        <p className="text-slate-500">
          Compare team productivity, lead conversion and task completion.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Table</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Task Rate</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="font-semibold">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.role}</Badge>
                  </TableCell>
                  <TableCell>{member.ownedCompanies}</TableCell>
                  <TableCell>{member.totalLeads}</TableCell>
                  <TableCell>{member.convertedLeads}</TableCell>
                  <TableCell>{member.conversionRate}%</TableCell>
                  <TableCell>{member.totalTasks}</TableCell>
                  <TableCell>{member.completedTasks}</TableCell>
                  <TableCell>{member.openTasks}</TableCell>
                  <TableCell>{member.taskCompletionRate}%</TableCell>
                  <TableCell className="font-semibold">
                    {member.performanceScore}%
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10">
                    No team performance data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
