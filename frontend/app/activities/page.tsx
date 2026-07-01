"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company?: Company;
  companyId?: string;
};
type Lead = {
  id: string;
  source?: string;
  company?: Company;
  companyId?: string;
};
type Deal = { id: string; title: string; company?: Company; companyId?: string };

type Activity = {
  id: string;
  type: string;
  title: string;
  content?: string;
  company?: Company;
  contact?: Contact;
  lead?: Lead;
  deal?: Deal;
  createdAt: string;
};

const activityTypes = ["CALL", "EMAIL", "MEETING", "NOTE", "TASK"];

const emptyForm = {
  type: "CALL",
  title: "",
  content: "",
  targetType: "company",
  targetId: "",
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function loadData() {
    const [nextActivities, nextCompanies, nextContacts, nextLeads, nextDeals] =
      await Promise.all([
        apiFetch("/activities"),
        apiFetch("/companies"),
        apiFetch("/contacts"),
        apiFetch("/leads"),
        apiFetch("/deals"),
      ]);
    setActivities(nextActivities);
    setCompanies(nextCompanies);
    setContacts(nextContacts);
    setLeads(nextLeads);
    setDeals(nextDeals);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createActivity() {
    const target = getSelectedTarget();
    const companyId = getTargetCompanyId(target);

    if (!form.title || !form.targetId || !companyId) return;

    await apiFetch(editId ? `/activities/${editId}` : "/activities", {
      method: editId ? "PUT" : "POST",
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        content: form.content,
        companyId,
        ...(editId
          ? {
              contactId: null,
              leadId: null,
              dealId: null,
            }
          : {}),
        ...(form.targetType !== "company"
          ? { [`${form.targetType}Id`]: form.targetId }
          : {}),
      }),
    });

    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
    loadData();
  }

  function startEdit(activity: Activity) {
    const targetType = activity.contact
      ? "contact"
      : activity.lead
        ? "lead"
        : activity.deal
          ? "deal"
          : "company";

    const targetId =
      activity.contact?.id ||
      activity.lead?.id ||
      activity.deal?.id ||
      activity.company?.id ||
      "";

    setEditId(activity.id);
    setForm({
      type: activity.type,
      title: activity.title,
      content: activity.content || "",
      targetType,
      targetId,
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(false);
  }

  async function deleteActivity(id: string) {
    await apiFetch(`/activities/${id}`, { method: "DELETE" });
    loadData();
  }

  function getTargetOptions() {
    if (form.targetType === "contact") {
      return contacts.map((contact) => ({
        id: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
        item: contact,
      }));
    }

    if (form.targetType === "lead") {
      return leads.map((lead) => ({
        id: lead.id,
        label: `${lead.company?.name || "Lead"} - ${lead.source || "Unknown"}`,
        item: lead,
      }));
    }

    if (form.targetType === "deal") {
      return deals.map((deal) => ({
        id: deal.id,
        label: deal.title,
        item: deal,
      }));
    }

    return companies.map((company) => ({
      id: company.id,
      label: company.name,
      item: company,
    }));
  }

  function getSelectedTarget() {
    return getTargetOptions().find((target) => target.id === form.targetId)?.item;
  }

  function getTargetCompanyId(target: Company | Contact | Lead | Deal | undefined) {
    if (!target) return "";
    if (form.targetType === "company") return target.id;
    return "companyId" in target
      ? target.company?.id || target.companyId || ""
      : "";
  }

  function getActivityTarget(activity: Activity) {
    if (activity.contact) {
      return `Contact - ${activity.contact.firstName} ${activity.contact.lastName}`;
    }

    if (activity.lead) {
      return `Lead - ${activity.lead.company?.name || activity.company?.name || "-"}`;
    }

    if (activity.deal) {
      return `Deal - ${activity.deal.title}`;
    }

    return activity.company ? `Company - ${activity.company.name}` : "-";
  }

  function getTargetPlaceholder() {
    if (form.targetType === "contact") return "Select contact";
    if (form.targetType === "lead") return "Select lead";
    if (form.targetType === "deal") return "Select deal";
    return "Select company";
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-slate-500">
            Track calls, emails, meetings and follow-up history.
          </p>
        </div>

        <Button onClick={openCreate}>+ New Activity</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Activity" : "Create Activity"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border rounded-md px-3 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <Input
              placeholder="Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />

            <select
              className="border rounded-md px-3 py-2"
              value={form.targetType}
              onChange={(e) =>
                setForm({ ...form, targetType: e.target.value, targetId: "" })
              }
            >
              <option value="company">Company</option>
              <option value="contact">Contact</option>
              <option value="lead">Lead</option>
              <option value="deal">Deal</option>
            </select>

            <select
              className="border rounded-md px-3 py-2 md:col-span-2"
              value={form.targetId}
              onChange={(e) => setForm({ ...form, targetId: e.target.value })}
            >
              <option value="">{getTargetPlaceholder()}</option>
              {getTargetOptions().map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>

            <Button className="md:col-span-2" onClick={createActivity}>
              {editId ? "Save Changes" : "Add Activity"}
            </Button>
            {editId && (
              <Button
                className="md:col-span-2"
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {activities.map((activity) => (
                <Fragment key={activity.id}>
                  <TableRow key={activity.id}>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell className="font-semibold">{activity.title}</TableCell>
                    <TableCell>{getActivityTarget(activity)}</TableCell>
                    <TableCell>{activity.company?.name || "-"}</TableCell>
                    <TableCell>{activity.content || "-"}</TableCell>
                    <TableCell>{activity.createdAt.slice(0, 10)}</TableCell>
                    <TableCell className="relative pr-10 text-right">
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label="Activity actions"
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-32 min-w-32"
                          >
                            <DropdownMenuItem
                              onClick={() => startEdit(activity)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteActivity(activity.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {editId === activity.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-md border bg-white p-4">
                          <select
                            className="border rounded-md px-3 py-2"
                            value={form.type}
                            onChange={(e) =>
                              setForm({ ...form, type: e.target.value })
                            }
                          >
                            {activityTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>

                          <Input
                            placeholder="Title"
                            value={form.title}
                            onChange={(e) =>
                              setForm({ ...form, title: e.target.value })
                            }
                          />

                          <Input
                            placeholder="Content"
                            value={form.content}
                            onChange={(e) =>
                              setForm({ ...form, content: e.target.value })
                            }
                          />

                          <select
                            className="border rounded-md px-3 py-2"
                            value={form.targetType}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                targetType: e.target.value,
                                targetId: "",
                              })
                            }
                          >
                            <option value="company">Company</option>
                            <option value="contact">Contact</option>
                            <option value="lead">Lead</option>
                            <option value="deal">Deal</option>
                          </select>

                          <select
                            className="border rounded-md px-3 py-2"
                            value={form.targetId}
                            onChange={(e) =>
                              setForm({ ...form, targetId: e.target.value })
                            }
                          >
                            <option value="">{getTargetPlaceholder()}</option>
                            {getTargetOptions().map((target) => (
                              <option key={target.id} value={target.id}>
                                {target.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={createActivity}>
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}

              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    No activities found.
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
