"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getStoredUser } from "@/lib/permissions";
import { MoreHorizontal } from "lucide-react";

type Company = {
  id: string;
  name: string;
  taxNumber?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
};

const emptyForm = {
  name: "",
  taxNumber: "",
  industry: "",
  website: "",
  phone: "",
  email: "",
  address: "",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [canManageCompanies, setCanManageCompanies] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const mountedRef = useRef(false);

  async function loadCompanies(queryValue = search) {
    const trimmed = queryValue.trim();
    const query = trimmed ? `?search=${encodeURIComponent(trimmed)}` : "";
    const data = await apiFetch(`/companies${query}`);
    setCompanies(data);
  }

  useEffect(() => {
    setCanManageCompanies(getStoredUser()?.role === "ADMIN");
    loadCompanies().catch(() => {});
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (!search.trim()) {
      loadCompanies("").catch(() => {});
    }
  }, [search]);

  async function saveCompany() {
    if (!form.name.trim()) return;

    if (editId) {
      await apiFetch(`/companies/${editId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
    } else {
      await apiFetch("/companies", {
        method: "POST",
        body: JSON.stringify(form),
      });
    }

    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
    loadCompanies();
  }

  function startEdit(company: Company) {
    setEditId(company.id);
    setForm({
      name: company.name || "",
      taxNumber: company.taxNumber || "",
      industry: company.industry || "",
      website: company.website || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
    });
    setOpen(true);
  }

  async function deleteCompany(id: string) {
    await apiFetch(`/companies/${id}`, {
      method: "DELETE",
    });

    loadCompanies();
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
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-slate-500">
            Manage companies, business information and assigned customer records.
          </p>
        </div>

        {canManageCompanies && (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              onClick={openCreate}
              className="h-10 px-5 text-sm font-semibold shadow-sm"
            >
              + New Company
            </Button>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "Edit Company" : "Create Company"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Company name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <Input
                  placeholder="Tax number"
                  value={form.taxNumber}
                  onChange={(e) =>
                    setForm({ ...form, taxNumber: e.target.value })
                  }
                />

                <Input
                  placeholder="Industry"
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                />

                <Input
                  placeholder="Website"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                />

                <Input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <Input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <Input
                  className="md:col-span-2"
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />

                <Button className="md:col-span-2" onClick={saveCompany}>
                  {editId ? "Save Changes" : "Create Company"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Total Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{companies.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Industries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Set(companies.map((c) => c.industry).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              With Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {companies.filter((c) => c.email).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Active Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{companies.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Companies List</CardTitle>

          <div className="flex items-center gap-2">
            <Input
              className="w-72"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" onClick={() => loadCompanies(search)}>
              Search
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                {canManageCompanies && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="font-semibold">{company.name}</div>
                    <div className="text-xs text-slate-500">
                      Tax: {company.taxNumber || "-"}
                    </div>
                  </TableCell>

                  <TableCell>{company.industry || "-"}</TableCell>
                  <TableCell>{company.email || "-"}</TableCell>
                  <TableCell>{company.phone || "-"}</TableCell>
                  <TableCell>{company.website || "-"}</TableCell>
                  <TableCell>{company.address || "-"}</TableCell>

                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>

                  {canManageCompanies && (
                    <TableCell className="relative overflow-visible text-right align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Company actions"
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-28 min-w-28">
                          <DropdownMenuItem onClick={() => startEdit(company)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deleteCompany(company.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {companies.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManageCompanies ? 8 : 7}
                    className="text-center text-slate-500 py-10"
                  >
                    No companies found.
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
