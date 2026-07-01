"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
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

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "SALES",
  status: "ACTIVE",
};

const selectClassName =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function loadUsers() {
    setUsers(await apiFetch("/users"));
  }

  useEffect(() => {
    loadUsers().catch((err) => setError(err.message));
  }, []);

  async function saveUser() {
    setError("");
    try {
      const payload = { ...form, password: form.password || undefined };
      await apiFetch(editId ? `/users/${editId}` : "/users", {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setForm(emptyForm);
      setEditId(null);
      setOpen(false);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    }
  }

  function startEdit(user: User) {
    setEditId(user.id);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setOpen(true);
  }

  async function deleteUser(id: string) {
    try {
      setError("");
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Users & Roles</h2>
          <p className="text-sm text-slate-500">Team access and account status</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add user
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder={editId ? "New password (optional)" : "Password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className={selectClassName} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="SALES">Sales Representative</option>
            </select>
            <select className={selectClassName} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <Button className="md:col-span-2" onClick={saveUser}>
              {editId ? "Save changes" : "Create user"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role === "SALES" ? "Sales Representative" : user.role === "ADMIN" ? "Administrator" : "Manager"}</TableCell>
                <TableCell>{user.status === "ACTIVE" ? "Active" : "Inactive"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button size="icon-xs" variant="ghost" aria-label="User actions"><MoreHorizontal /></Button>} />
                    <DropdownMenuContent align="end" className="w-32 min-w-32">
                      <DropdownMenuItem onClick={() => startEdit(user)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => deleteUser(user.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!users.length && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-500">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
