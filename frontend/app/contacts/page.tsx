"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

type Activity = {
  id: string;
  type: string;
  title: string;
  createdAt: string;
};

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: Company;
  companyId?: string;
  notes?: Note[];
  activities?: Activity[];
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  companyId: "",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  async function loadData() {
    setContacts(await apiFetch("/contacts"));
    setCompanies(await apiFetch("/companies"));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveContact() {
    if (!form.firstName || !form.lastName || !form.companyId) return;

    if (editId) {
      await apiFetch(`/contacts/${editId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
    } else {
      await apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify(form),
      });
    }

    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
    loadData();
  }

  function startEdit(contact: Contact) {
    setEditId(contact.id);
    setForm({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      position: contact.position || "",
      companyId: contact.company?.id || contact.companyId || "",
    });
    setOpen(true);
  }

  async function deleteContact(id: string) {
    await apiFetch(`/contacts/${id}`, { method: "DELETE" });
    loadData();
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  async function addNote(contactId: string) {
    if (!noteText.trim()) return;

    await apiFetch("/notes", {
      method: "POST",
      body: JSON.stringify({
        content: noteText,
        contactId,
      }),
    });

    setNoteText("");
    setSelectedContactId(null);
    loadData();
  }

  async function updateNote(noteId: string) {
    if (!editingNoteText.trim()) return;

    await apiFetch(`/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({
        content: editingNoteText,
      }),
    });

    setEditingNoteId(null);
    setEditingNoteText("");
    loadData();
  }

  async function deleteNote(noteId: string) {
    await apiFetch(`/notes/${noteId}`, { method: "DELETE" });
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-slate-500">
            Manage people linked to companies and customer relationships.
          </p>
        </div>

        <Button onClick={openCreate}>+ New Contact</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Contact" : "Create Contact"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium">Assign Company</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={form.companyId}
                onChange={(e) =>
                  setForm({ ...form, companyId: e.target.value })
                }
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <Button className="md:col-span-2" onClick={saveContact}>
              {editId ? "Save Changes" : "Create Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">With Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {contacts.filter((contact) => contact.email).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Companies Linked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Set(contacts.map((contact) => contact.company?.id).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contacts List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-semibold">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>{contact.company?.name || "-"}</TableCell>
                  <TableCell>{contact.email || "-"}</TableCell>
                  <TableCell>{contact.phone || "-"}</TableCell>
                  <TableCell>{contact.position || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell className="min-w-64">
                    <div className="space-y-2">
                      {contact.notes?.length ? (
                        <div className="space-y-2">
                          {contact.notes.slice(0, 3).map((note) => (
                            <div
                              key={note.id}
                              className="rounded-md border p-2 text-sm"
                            >
                              {editingNoteId === note.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingNoteText}
                                    onChange={(e) =>
                                      setEditingNoteText(e.target.value)
                                    }
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateNote(note.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingNoteId(null);
                                        setEditingNoteText("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-slate-600">
                                      {note.content}
                                    </p>
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
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingNoteId(note.id);
                                            setEditingNoteText(note.content);
                                          }}
                                        >
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
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No notes</p>
                      )}

                      {!contact.notes?.length &&
                        (selectedContactId === contact.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add note"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={() => addNote(contact.id)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContactId(contact.id);
                              setNoteText("");
                            }}
                          >
                            Add Note
                          </Button>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-56">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-500">
                        {contact.activities?.[0]
                          ? `${contact.activities[0].type}: ${contact.activities[0].title}`
                          : "No activities"}
                      </p>
                      {contact.activities?.[0] && (
                        <p className="text-xs text-slate-400">
                          {contact.activities[0].createdAt.slice(0, 10)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="relative overflow-visible text-right align-top">
                    <details className="relative inline-flex justify-end">
                      <summary
                        className="list-none cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 [&::-webkit-details-marker]:hidden"
                        aria-label="Contact actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </summary>

                      <div className="absolute right-0 top-8 z-50 w-28 rounded-md border bg-white p-1 shadow-lg">
                        <button
                          className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                          type="button"
                          onClick={() => startEdit(contact)}
                        >
                          Edit
                        </button>
                        <button
                          className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                          type="button"
                          onClick={() => deleteContact(contact.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </details>
                  </TableCell>
                </TableRow>
              ))}

              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                    No contacts found.
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
