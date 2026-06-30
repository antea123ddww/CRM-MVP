import { Company } from "@/types/company";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getCompanies(): Promise<Company[]> {
  const res = await fetch(`${API_URL}/companies`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch companies");
  }

  return res.json();
}

export async function createCompany(data: Omit<Company, "id">) {
  const res = await fetch(`${API_URL}/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create company");
  }

  return res.json();
}

export async function deleteCompany(id: string) {
  const res = await fetch(`${API_URL}/companies/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete company");
  }

  return res.json();
}