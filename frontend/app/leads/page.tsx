"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

type Company = { id: string; name: string };
type User = { id: string; firstName: string; lastName: string; email: string };

type FollowUp = {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
};

type Lead = {
  id: string;
  source?: string;
  status: string;
  estimatedValue?: string;
  company?: Company;
  companyId?: string;
  assignedToId?: string;
  assignedTo?: User;
  followUps?: FollowUp[];
};

const emptyForm = {
  companyId: "",
  source: "",
  status: "NEW",
  estimatedValue: "",
  assignedToId: "",
};

const statuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];

function getStatusName(lead: Lead) {
  return lead.status || "-";
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  async function loadData() {
    const role = getStoredUser()?.role || null;
    setUserRole(role);

    const [nextLeads, nextCompanies, nextUsers] = await Promise.all([
      apiFetch("/leads"),
      role === "ADMIN" || role === "SALES"
        ? apiFetch("/companies")
        : Promise.resolve([]),
      role === "ADMIN" || role === "MANAGER"
        ? apiFetch("/users/assignable")
        : Promise.resolve([]),
    ]);

    setLeads(nextLeads);
    setCompanies(nextCompanies);
    setUsers(nextUsers);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveLead() {
    if (userRole === "MANAGER" && editId) {
      if (!form.assignedToId) return;

      await apiFetch(`/leads/${editId}`, {
        method: "PUT",
        body: JSON.stringify({
          assignedToId: form.assignedToId,
        }),
      });

      setForm(emptyForm);
      setEditId(null);
      setOpen(false);
      loadData();
      return;
    }

    if (!form.companyId) return;

    const payload = {
      ...form,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      assignedToId: form.assignedToId || undefined,
      source: form.source || undefined,
    };

    if (editId) {
      await apiFetch(`/leads/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

      setForm(emptyForm);
    setEditId(null);
    setOpen(false);
    loadData();
  }

  function startEdit(lead: Lead) {
    const currentAssignee = lead.assignedTo?.id || lead.assignedToId || "";
    setEditId(lead.id);
    setForm({
      companyId: lead.company?.id || lead.companyId || "",
      source: lead.source || "",
      status: lead.status || "NEW",
      estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : "",
      assignedToId: users.length === 1 ? users[0].id : currentAssignee,
    });
    setOpen(true);
  }

  async function deleteLead(id: string) {
    await apiFetch(`/leads/${id}`, { method: "DELETE" });
    loadData();
  }

  async function assignLeadDirectly(leadId: string, userId: string) {
    await apiFetch(`/leads/${leadId}`, {
      method: "PUT",
      body: JSON.stringify({ assignedToId: userId }),
    });
    loadData();
  }

  async function addFollowUp(lead: Lead) {
    if (!followUpTitle.trim()) return;

    await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: followUpTitle,
        dueDate: followUpDueDate || undefined,
        priority: "MEDIUM",
        status: "OPEN",
        companyId: lead.company?.id || lead.companyId,
        leadId: lead.id,
      }),
    });

    setFollowUpLeadId(null);
    setFollowUpTitle("");
    setFollowUpDueDate("");
    loadData();
  }

  function openFollowUpEditor(leadId: string) {
    if (followUpLeadId === leadId) {
      setFollowUpLeadId(null);
      setFollowUpTitle("");
      setFollowUpDueDate("");
      return;
    }

    setFollowUpLeadId(leadId);
    setFollowUpTitle("");
    setFollowUpDueDate("");
  }

  function cancelFollowUpEditor() {
    setFollowUpLeadId(null);
    setFollowUpTitle("");
    setFollowUpDueDate("");
  }

  function openCreate() {
    setEditId(null);
    setForm({
      ...emptyForm,
      assignedToId: users.length === 1 ? users[0].id : "",
    });
    setOpen(true);
  }

  const canCreateLead = userRole === "ADMIN" || userRole === "SALES";
  const canEditLeadDetails = userRole === "ADMIN" || userRole === "SALES";
  const canAssignLead = userRole === "ADMIN" || userRole === "MANAGER";
  const canDeleteLead = userRole === "ADMIN";
  const canManageFollowUps = userRole === "ADMIN" || userRole === "SALES";
  const canOpenLeadMenu = canEditLeadDetails || canAssignLead || canDeleteLead;
  const managerCanAssignAny =
    userRole === "MANAGER" &&
    users.length > 0 &&
    (users.length > 1 ||
      leads.some(
        (lead) =>
          (lead.assignedTo?.id || lead.assignedToId) !== users[0].id
      ));
  const showActions = userRole !== "MANAGER" || managerCanAssignAny;
  const visibleColumnCount = 5 + Number(canManageFollowUps) + Number(showActions);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-slate-500">
            Track potential customers, lead source and qualification status.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          {canCreateLead && <Button onClick={openCreate}>+ New Lead</Button>}

          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editId
                  ? userRole === "MANAGER"
                    ? "Assign Lead"
                    : "Edit Lead"
                  : "Create Lead"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canEditLeadDetails && (
                <>
                  <select className="border rounded-md px-3 py-2" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                    <option value="">Select company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>

                  <Input
                    placeholder="Lead source"
                    value={form.source}
                    onChange={(e) =>
                      setForm({ ...form, source: e.target.value })
                    }
                  />

                  <select
                    className="border rounded-md px-3 py-2"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <Input placeholder="Estimated value" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
                </>
              )}

              {canAssignLead && users.length > 1 && (
                <select
                  className="border rounded-md px-3 py-2 md:col-span-2"
                  value={form.assignedToId}
                  onChange={(e) =>
                    setForm({ ...form, assignedToId: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select Sales Representative
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              )}

              {canAssignLead && users.length === 1 && (
                <div className="flex h-10 items-center rounded-md border bg-slate-50 px-3 text-sm md:col-span-2">
                  {users[0].firstName} {users[0].lastName}
                </div>
              )}

              {canAssignLead && users.length === 0 && (
                <div className="flex h-10 items-center rounded-md border border-amber-200 bg-amber-50 px-3 text-sm text-amber-700 md:col-span-2">
                  No active Sales Representatives available
                </div>
              )}

              <Button className="md:col-span-2" onClick={saveLead}>
                {editId && userRole === "MANAGER"
                  ? "Assign Lead"
                  : editId
                    ? "Save Changes"
                    : "Create Lead"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle className="text-sm text-slate-500">Total Leads</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leads.length}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-slate-500">Qualified</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leads.filter((l) => getStatusName(l) === "QUALIFIED").length}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-slate-500">Converted</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leads.filter((l) => getStatusName(l) === "CONVERTED").length}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-slate-500">Lost</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leads.filter((l) => getStatusName(l) === "LOST").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Leads List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Estimated Value</TableHead>
                {canManageFollowUps && <TableHead>Follow-ups</TableHead>}
                {showActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-semibold">{lead.company?.name || "-"}</TableCell>
                  <TableCell>{lead.source || "-"}</TableCell>
                  <TableCell><Badge variant="secondary">{getStatusName(lead)}</Badge></TableCell>
                  <TableCell>
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell>EUR {lead.estimatedValue || 0}</TableCell>
                  {canManageFollowUps && <TableCell>
                    <div className="space-y-2 min-w-[260px]">
                      <p className="text-sm text-slate-500">
                        {lead.followUps?.[0]?.title || "No follow-ups"}
                      </p>

                      {canManageFollowUps && followUpLeadId === lead.id ? (
                        <div className="space-y-2 rounded-md border bg-slate-50 p-3">
                          <Input
                            className="h-9"
                            placeholder="Follow-up title"
                            value={followUpTitle}
                            onChange={(e) => setFollowUpTitle(e.target.value)}
                          />
                          <Input
                            className="h-9"
                            type="date"
                            value={followUpDueDate}
                            onChange={(e) => setFollowUpDueDate(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => addFollowUp(lead)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={cancelFollowUpEditor}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : canManageFollowUps ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openFollowUpEditor(lead.id)}
                        >
                          Add Follow-up
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>}
                  {showActions && <TableCell className="relative overflow-visible text-right align-top">
                    {userRole === "MANAGER" &&
                      canAssignLead &&
                      users.length > 0 &&
                      (users.length > 1 ||
                        (lead.assignedTo?.id || lead.assignedToId) !==
                          users[0].id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          users.length === 1
                            ? assignLeadDirectly(lead.id, users[0].id)
                            : startEdit(lead)
                        }
                      >
                        {users.length === 1
                          ? `Assign to ${users[0].firstName}`
                          : "Assign Lead"}
                      </Button>
                      )}

                    {userRole === "SALES" && canEditLeadDetails && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(lead)}
                      >
                        Edit
                      </Button>
                    )}

                    {userRole === "ADMIN" && canOpenLeadMenu && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Lead actions"
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-36 min-w-36">
                          {canEditLeadDetails && (
                            <DropdownMenuItem
                              onClick={() => startEdit(lead)}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteLead && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteLead(lead.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>}
                </TableRow>
              ))}

              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="text-center py-10 text-slate-500">
                    No leads found.
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
