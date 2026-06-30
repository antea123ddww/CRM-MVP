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

type Setting = {
  id: string;
  key: string;
  value: string;
};

const emptyForm = {
  key: "",
  value: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function loadSettings() {
    setSettings(await apiFetch("/settings"));
  }

  useEffect(() => {
    loadSettings().catch((err) => setError(err.message));
  }, []);

  async function saveSetting() {
    if (!form.key) return;

    setError("");

    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setOpen(false);
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setting");
    }
  }

  async function deleteSetting(id: string) {
    await apiFetch(`/settings/${id}`, { method: "DELETE" });
    loadSettings();
  }

  function startEdit(setting: Setting) {
    setEditId(setting.id);
    setEditForm({
      key: setting.key,
      value: setting.value,
    });
    setOpen(true);
  }

  async function updateSetting() {
    if (!editForm.key) return;

    setError("");

    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify(editForm),
      });
      setEditId(null);
      setEditForm(emptyForm);
      setOpen(false);
      loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting");
    }
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-500">
            Manage configurable CRM key-value settings.
          </p>
        </div>

        <Button onClick={openCreate}>+ New Setting</Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Setting" : "Create Setting"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Key"
              value={editId ? editForm.key : form.key}
              onChange={(e) =>
                editId
                  ? setEditForm({ ...editForm, key: e.target.value })
                  : setForm({ ...form, key: e.target.value })
              }
            />
            <Input
              placeholder="Value"
              value={editId ? editForm.value : form.value}
              onChange={(e) =>
                editId
                  ? setEditForm({ ...editForm, value: e.target.value })
                  : setForm({ ...form, value: e.target.value })
              }
            />
            <Button className="md:col-span-2" onClick={editId ? updateSetting : saveSetting}>
              {editId ? "Save Changes" : "Save Setting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Settings List</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {settings.map((setting) => (
                <Fragment key={setting.id}>
                  <TableRow key={setting.id}>
                    <TableCell className="font-semibold">{setting.key}</TableCell>
                    <TableCell>{setting.value}</TableCell>
                    <TableCell className="relative pr-10 text-right">
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label="Setting actions"
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-32 min-w-32"
                          >
                            <DropdownMenuItem onClick={() => startEdit(setting)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteSetting(setting.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {editId === setting.id && (
                    <TableRow>
                      <TableCell colSpan={3} className="bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-md border bg-white p-4">
                          <Input
                            placeholder="Key"
                            value={editForm.key}
                            onChange={(e) =>
                              setEditForm({ ...editForm, key: e.target.value })
                            }
                          />
                          <Input
                            placeholder="Value"
                            value={editForm.value}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                value: e.target.value,
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={updateSetting}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditId(null);
                                setEditForm(emptyForm);
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

              {settings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    No settings found.
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
