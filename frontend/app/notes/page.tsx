"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

type Entity = { id: string; name?: string; firstName?: string; lastName?: string; title?: string };

type Note = {
  id: string;
  content: string;
  company?: Entity;
  contact?: Entity;
  lead?: { id: string; company?: Entity };
  deal?: Entity;
  createdAt: string;
};

type LeadTarget = {
  id: string;
  company?: Entity;
};

const emptyForm = {
  content: "",
  targetType: "company",
  targetId: "",
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [companies, setCompanies] = useState<Entity[]>([]);
  const [contacts, setContacts] = useState<Entity[]>([]);
  const [leads, setLeads] = useState<LeadTarget[]>([]);
  const [deals, setDeals] = useState<Entity[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [open, setOpen] = useState(false);

  async function loadData() {
    const [nextNotes, nextCompanies, nextContacts, nextLeads, nextDeals] =
      await Promise.all([
        apiFetch("/notes"),
        apiFetch("/companies"),
        apiFetch("/contacts"),
        apiFetch("/leads"),
        apiFetch("/deals"),
      ]);
    setNotes(nextNotes);
    setCompanies(nextCompanies);
    setContacts(nextContacts);
    setLeads(nextLeads);
    setDeals(nextDeals);
  }

  useEffect(() => {
    loadData();
  }, []);

  const targets = useMemo(() => {
    if (form.targetType === "contact") {
      return contacts.map((contact) => ({
        id: contact.id,
        label: `${contact.firstName} ${contact.lastName}`,
      }));
    }

    if (form.targetType === "lead") {
      return leads.map((lead) => ({
        id: lead.id,
        label: `Lead - ${lead.company?.name || lead.id}`,
      }));
    }

    if (form.targetType === "deal") {
      return deals.map((deal) => ({
        id: deal.id,
        label: deal.title || deal.id,
      }));
    }

    return companies.map((company) => ({
      id: company.id,
      label: company.name || company.id,
    }));
  }, [companies, contacts, deals, form.targetType, leads]);

  async function createNote() {
    if (!form.content || !form.targetId) return;

    await apiFetch("/notes", {
      method: "POST",
      body: JSON.stringify({
        content: form.content,
        [`${form.targetType}Id`]: form.targetId,
      }),
    });

    setForm(emptyForm);
    setOpen(false);
    loadData();
  }

  async function deleteNote(id: string) {
    await apiFetch(`/notes/${id}`, { method: "DELETE" });
    loadData();
  }

  function startEdit(note: Note) {
    setEditId(note.id);
    setEditContent(note.content);
  }

  function openCreate() {
    setEditId(null);
    setEditContent("");
    setForm(emptyForm);
    setOpen(true);
  }

  async function updateNote(id: string) {
    if (!editContent.trim()) return;

    await apiFetch(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        content: editContent,
      }),
    });

    setEditId(null);
    setEditContent("");
    loadData();
  }

  function noteTarget(note: Note) {
    if (note.company) return `Company: ${note.company.name}`;
    if (note.contact) return `Contact: ${note.contact.firstName} ${note.contact.lastName}`;
    if (note.lead) return `Lead: ${note.lead.company?.name || note.lead.id}`;
    if (note.deal) return `Deal: ${note.deal.title}`;
    return "-";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-slate-500">
            Attach notes to companies, contacts, leads and deals.
          </p>
        </div>

        <Button onClick={openCreate}>+ New Note</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Write a note..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="border rounded-md px-3 py-2"
                value={form.targetId}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              >
                <option value="">Select target</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>

              <Button className="md:col-span-2" onClick={createNote}>
                Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Notes List</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Attached To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {notes.map((note) => (
                <Fragment key={note.id}>
                  <TableRow key={note.id}>
                    <TableCell>{note.content}</TableCell>
                    <TableCell>{noteTarget(note)}</TableCell>
                    <TableCell>{note.createdAt.slice(0, 10)}</TableCell>
                    <TableCell className="relative pr-10 text-right">
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label="Note actions"
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-32 min-w-32"
                          >
                            <DropdownMenuItem onClick={() => startEdit(note)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteNote(note.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {editId === note.id && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-slate-50">
                        <div className="space-y-3 rounded-md border bg-white p-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateNote(note.id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditId(null);
                                setEditContent("");
                              }}
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

              {notes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    No notes found.
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
