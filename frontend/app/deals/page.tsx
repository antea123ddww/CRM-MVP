"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MoreHorizontal } from "lucide-react";

type Company = { id: string; name: string };

type Deal = {
  id: string;
  title: string;
  value: string;
  stage: string;
  closeDate?: string;
  companyId?: string;
  company?: Company;
};

const stageProbability: Record<string, number> = {
  NEW: 0.1,
  QUALIFIED: 0.3,
  PROPOSAL: 0.5,
  NEGOTIATION: 0.75,
  WON: 1,
  LOST: 0,
};

const stages = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseDealValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isThisMonth(date?: string) {
  if (!date) return false;

  const closeDate = new Date(date);
  const today = new Date();

  return (
    closeDate.getFullYear() === today.getFullYear() &&
    closeDate.getMonth() === today.getMonth()
  );
}

function formatDate(date?: string) {
  return date ? new Date(date).toISOString().slice(0, 10) : "-";
}

function getStageName(deal: Deal) {
  return deal.stage || "-";
}

function getStageProbability(deal: Deal) {
  return stageProbability[getStageName(deal)] || 0;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    value: "",
    stage: "NEW",
    closeDate: "",
    companyId: "",
  });

  async function loadData(role = userRole) {
    try {
      setError(null);
      const [nextDeals, nextCompanies] = await Promise.all([
        apiFetch("/deals"),
        role === "ADMIN" || role === "SALES"
          ? apiFetch("/companies")
          : Promise.resolve([]),
      ]);
      setDeals(nextDeals);
      setCompanies(nextCompanies);
    } catch (err) {
      setDeals([]);
      setCompanies([]);
      setError(err instanceof Error ? err.message : "Failed to load deals.");
    }
  }

  useEffect(() => {
    const role = getStoredUser()?.role || null;
    setUserRole(role);
    loadData(role);
  }, []);

  const canManageDeals = userRole === "ADMIN";
  const canEditDealDetails = userRole === "ADMIN" || userRole === "SALES";

  const revenueStats = useMemo(() => {
    const wonRevenue = deals
      .filter((deal) => getStageName(deal) === "WON")
      .reduce((sum, deal) => sum + parseDealValue(deal.value), 0);

    const openPipeline = deals
      .filter((deal) => !["WON", "LOST"].includes(getStageName(deal)))
      .reduce((sum, deal) => sum + parseDealValue(deal.value), 0);

    const forecastRevenue = deals.reduce((sum, deal) => {
      return sum + parseDealValue(deal.value) * getStageProbability(deal);
    }, 0);

    const monthlyForecast = deals
      .filter((deal) => isThisMonth(deal.closeDate))
      .reduce((sum, deal) => {
        return sum + parseDealValue(deal.value) * getStageProbability(deal);
      }, 0);

    return {
      wonRevenue,
      openPipeline,
      forecastRevenue,
      monthlyForecast,
    };
  }, [deals]);

  const forecastDeals = useMemo(() => {
    return deals
      .filter((deal) => getStageName(deal) !== "LOST")
      .map((deal) => {
        const value = parseDealValue(deal.value);
        const probability = getStageProbability(deal);

        return {
          ...deal,
          probability,
          forecastValue: value * probability,
        };
      })
      .sort((a, b) => b.forecastValue - a.forecastValue)
      .slice(0, 5);
  }, [deals]);

  async function createDeal() {
    if (!form.title || !form.value || !form.companyId) return;
    try {
      setError(null);
      const payload = {
        ...form,
        value: Number(form.value),
      };

      if (editingDealId) {
        await apiFetch(`/deals/${editingDealId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/deals", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setForm({
        title: "",
        value: "",
        stage: "NEW",
        closeDate: "",
        companyId: "",
      });
      setEditingDealId(null);
      setOpen(false);

      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal.");
    }
  }

  async function updateDealStage(id: string, stage: string) {
    try {
      setError(null);
      await apiFetch(`/deals/${id}`, {
        method: "PUT",
        body: JSON.stringify({ stage }),
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deal.");
    }
  }

  function startEditDeal(deal: Deal) {
    setEditingDealId(deal.id);
    setForm({
      title: deal.title,
      value: String(deal.value),
      stage: deal.stage,
      closeDate: deal.closeDate ? deal.closeDate.slice(0, 10) : "",
      companyId: deal.company?.id || deal.companyId || "",
    });
    setOpen(true);
  }

  async function deleteDeal(id: string) {
    try {
      setError(null);
      await apiFetch(`/deals/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deal.");
    }
  }

  function openCreate() {
    setEditingDealId(null);
    setForm({
      title: "",
      value: "",
      stage: "NEW",
      closeDate: "",
      companyId: "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-slate-500">
            Manage opportunities, pipeline stages and revenue forecasting.
          </p>
        </div>

        {canManageDeals && <Button onClick={openCreate}>+ New Deal</Button>}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Won Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(revenueStats.wonRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Open Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(revenueStats.openPipeline)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Forecast Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(revenueStats.forecastRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">This Month Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(revenueStats.monthlyForecast)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingDealId ? "Edit Deal" : "Create Deal"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Deal title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />

            <select
              className="border rounded-md px-3 py-2"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={form.closeDate}
              onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
            />

            <select
              className="border rounded-md px-3 py-2 md:col-span-2"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            <Button className="md:col-span-2" onClick={createDeal}>
              {editingDealId ? "Save Changes" : "Create Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Deal Forecasting</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {forecastDeals.map((deal) => (
            <div
              key={deal.id}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 border-b py-3 text-sm last:border-b-0"
            >
              <div className="font-semibold">{deal.title}</div>
              <div>{deal.company?.name || "-"}</div>
              <div>{getStageName(deal)}</div>
              <div>{Math.round(deal.probability * 100)}% probability</div>
              <div className="font-semibold">
                {formatCurrency(deal.forecastValue)}
              </div>
            </div>
          ))}

          {!forecastDeals.length && (
            <p className="text-sm text-muted-foreground">
              No active deals to forecast.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <Card key={stage}>
            <CardHeader>
              <CardTitle className="text-sm">{stage}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {deals
                .filter((deal) => deal.stage === stage)
                .map((deal) => (
                  <div
                    key={deal.id}
                    className="relative border rounded-md p-3 space-y-2 pr-10"
                  >
                    <>
                        <p className="font-semibold">{deal.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {deal.company?.name || "-"}
                        </p>
                        <p className="text-sm font-medium">EUR {deal.value}</p>
                        <p className="text-xs text-muted-foreground">
                          Close: {formatDate(deal.closeDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Forecast:{" "}
                          {formatCurrency(
                            parseDealValue(deal.value) *
                              getStageProbability(deal)
                          )}
                        </p>
                        <select
                          className="w-full border rounded-md px-2 py-1 text-sm"
                          value={deal.stage}
                          onChange={(e) =>
                            updateDealStage(deal.id, e.target.value)
                          }
                        >
                          {stages.map((nextStage) => (
                            <option key={nextStage} value={nextStage}>
                              {nextStage}
                            </option>
                          ))}
                        </select>
                        {(canEditDealDetails || canManageDeals) && (
                          <div className="absolute top-2 right-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    aria-label="Deal actions"
                                  >
                                    <MoreHorizontal />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent
                                align="end"
                                className="w-32 min-w-32"
                              >
                                {canEditDealDetails && (
                                  <DropdownMenuItem
                                    onClick={() => startEditDeal(deal)}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canManageDeals && (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => deleteDeal(deal.id)}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                    </>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
