"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

type Company = { id: string; name: string };

type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  reminderAt?: string;
  priority: string;
  status: string;
  companyId?: string;
  company?: Company;
};

const activeStatuses = ["OPEN", "IN_PROGRESS"];

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateKey(value: string | Date) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return localDateKey(value);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function daysFromToday(dueDate?: string) {
  if (!dueDate) return null;

  const today = dateFromKey(localDateKey(new Date()));
  const due = dateFromKey(dateKey(dueDate));
  const diff = due.getTime() - today.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function isOverdue(dueDate?: string) {
  const days = daysFromToday(dueDate);

  return days !== null && days < 0;
}

function reminderDate(task: Task) {
  return task.reminderAt || task.dueDate;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    reminderAt: "",
    priority: "MEDIUM",
    status: "OPEN",
    companyId: "",
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    reminderAt: "",
    priority: "MEDIUM",
    status: "OPEN",
    companyId: "",
  });

  async function loadData() {
    try {
      setError(null);
      const [nextTasks, nextCompanies] = await Promise.all([
        apiFetch("/tasks"),
        apiFetch("/companies"),
      ]);
      setTasks(nextTasks);
      setCompanies(nextCompanies);
    } catch (err) {
      setTasks([]);
      setCompanies([]);
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const reminders = useMemo(() => {
    const activeTasks = tasks.filter((task) =>
      activeStatuses.includes(task.status)
    );

    const all = activeTasks
      .filter((task) => reminderDate(task))
      .sort((first, second) => {
        return (
          dateFromKey(dateKey(reminderDate(first) || "")).getTime() -
          dateFromKey(dateKey(reminderDate(second) || "")).getTime()
        );
      });

    const overdue = activeTasks.filter((task) => {
      const days = daysFromToday(reminderDate(task));
      return days !== null && days < 0;
    });

    const today = activeTasks.filter(
      (task) => daysFromToday(reminderDate(task)) === 0
    );

    const upcoming = activeTasks.filter((task) => {
      const days = daysFromToday(reminderDate(task));
      return days !== null && days > 0 && days <= 7;
    });

    return {
      all,
      overdue,
      today,
      upcoming,
      total: all.length,
    };
  }, [tasks]);

  async function createTask() {
    if (!form.title) return;
    try {
      setError(null);
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          companyId: form.companyId || undefined,
          reminderAt: form.reminderAt || undefined,
        }),
      });

      setForm({
        title: "",
        description: "",
        dueDate: "",
        reminderAt: "",
        priority: "MEDIUM",
        status: "OPEN",
        companyId: "",
      });
      setOpen(false);

      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  }

  async function deleteTask(id: string) {
    try {
      setError(null);
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  }

  async function updateTask(
    id: string,
    updates: Partial<
      Pick<
        Task,
        "title" | "description" | "dueDate" | "reminderAt" | "priority" | "status"
      > & { companyId?: string }
    >
  ) {
    try {
      setError(null);
      await apiFetch(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  function startEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      reminderAt: task.reminderAt ? task.reminderAt.slice(0, 10) : "",
      priority: task.priority,
      status: task.status,
      companyId: task.company?.id || task.companyId || "",
    });
  }

  function openCreate() {
    setEditingTaskId(null);
    setForm({
      title: "",
      description: "",
      dueDate: "",
      reminderAt: "",
      priority: "MEDIUM",
      status: "OPEN",
      companyId: "",
    });
    setOpen(true);
  }

  async function saveTask(id: string) {
    if (!editForm.title.trim()) return;

    await updateTask(id, {
      ...editForm,
      companyId: editForm.companyId || undefined,
      reminderAt: editForm.reminderAt || undefined,
      dueDate: editForm.dueDate || undefined,
    });

    setEditingTaskId(null);
    setEditForm({
      title: "",
      description: "",
      dueDate: "",
      reminderAt: "",
      priority: "MEDIUM",
      status: "OPEN",
      companyId: "",
    });
  }

  function dueLabel(dueDate?: string) {
    if (!dueDate) return "-";

    const todayKey = localDateKey(new Date());
    const dueKey = dateKey(dueDate);

    if (dueKey < todayKey) return `Overdue (${dueKey})`;
    if (dueKey === todayKey) return `Due today (${dueKey})`;
    return dueKey;
  }

  function reminderLabel(task: Task) {
    const days = daysFromToday(reminderDate(task));

    if (days === null) return "No due date";
    if (days < 0) return `${Math.abs(days)} day(s) overdue`;
    if (days === 0) return "Due today";
    return `Due in ${days} day(s)`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-slate-500">
            Manage due dates, reminders and task progress.
          </p>
        </div>

        <Button onClick={openCreate}>+ New Task</Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reminders.total}</p>
            <p className="text-sm text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {reminders.overdue.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {reminders.today.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Next 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {reminders.upcoming.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Reminders</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {reminders.all
            .slice(0, 8)
            .map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_160px_140px_auto] gap-3 items-center border-b py-3 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.company?.name || "No company"} · {task.priority}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    isOverdue(reminderDate(task))
                      ? "text-red-600"
                      : "text-slate-700"
                  }`}
                >
                  {reminderLabel(task)}
                </p>
                <p className="text-sm text-muted-foreground">{task.status}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTask(task.id, { status: "COMPLETED" })}
                >
                  Mark Done
                </Button>
              </div>
            ))}

          {reminders.total === 0 && (
            <p className="text-sm text-muted-foreground">
              No reminders right now.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="space-y-1">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reminder Date</label>
              <Input
                type="date"
                value={form.reminderAt}
                onChange={(e) =>
                  setForm({ ...form, reminderAt: e.target.value })
                }
              />
            </div>

            <select
              className="border rounded-md px-3 py-2"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>

            <select
              className="border rounded-md px-3 py-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              className="border rounded-md px-3 py-2 md:col-span-2"
              value={form.companyId}
              onChange={(e) =>
                setForm({ ...form, companyId: e.target.value })
              }
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button className="md:col-span-2" onClick={createTask}>
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Tasks List</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tasks.map((task) => (
                <Fragment key={task.id}>
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.company?.name || "-"}</TableCell>
                    <TableCell>
                      <select
                        className="border rounded-md px-2 py-1 text-sm"
                        value={task.priority}
                        onChange={(e) =>
                          updateTask(task.id, { priority: e.target.value })
                        }
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        className="border rounded-md px-2 py-1 text-sm"
                        value={task.status}
                        onChange={(e) =>
                          updateTask(task.id, { status: e.target.value })
                        }
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </TableCell>
                    <TableCell
                      className={
                        isOverdue(task.dueDate)
                          ? "font-semibold text-red-600"
                          : ""
                      }
                    >
                      {dueLabel(task.dueDate)}
                    </TableCell>
                    <TableCell>
                      {task.reminderAt ? task.reminderAt.slice(0, 10) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Task actions"
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-32 min-w-32">
                          <DropdownMenuItem onClick={() => startEditTask(task)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deleteTask(task.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {editingTaskId === task.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-md border bg-white p-4">
                          <Input
                            placeholder="Title"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                title: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Description"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                          />
                          <select
                            className="border rounded-md px-3 py-2"
                            value={editForm.companyId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                companyId: e.target.value,
                              })
                            }
                          >
                            <option value="">No company</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="border rounded-md px-3 py-2"
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                priority: e.target.value,
                              })
                            }
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="URGENT">URGENT</option>
                          </select>
                          <select
                            className="border rounded-md px-3 py-2"
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                status: e.target.value,
                              })
                            }
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Due Date</label>
                            <Input
                              type="date"
                              value={editForm.dueDate}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  dueDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Reminder Date</label>
                            <Input
                              type="date"
                              value={editForm.reminderAt}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  reminderAt: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button size="sm" onClick={() => saveTask(task.id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTaskId(null)}
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

              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No tasks found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
