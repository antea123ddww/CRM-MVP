export type UserRole = "ADMIN" | "MANAGER" | "SALES";

export type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: string;
};

export type MenuItem = {
  label: string;
  href: string;
  roles: UserRole[];
};

export const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["ADMIN", "MANAGER"] },
  { label: "Companies", href: "/companies", roles: ["ADMIN", "SALES"] },
  { label: "Contacts", href: "/contacts", roles: ["ADMIN"] },
  { label: "Leads", href: "/leads", roles: ["ADMIN", "MANAGER", "SALES"] },
  { label: "Deals", href: "/deals", roles: ["ADMIN", "MANAGER", "SALES"] },
  { label: "Tasks", href: "/tasks", roles: ["ADMIN", "SALES"] },
  { label: "Activities", href: "/activities", roles: ["ADMIN"] },
  { label: "Audit Logs", href: "/audit-logs", roles: ["ADMIN"] },
  { label: "Notes", href: "/notes", roles: ["ADMIN"] },
  { label: "Reports", href: "/reports", roles: ["ADMIN"] },
  {
    label: "Team Performance",
    href: "/team-performance",
    roles: ["ADMIN", "MANAGER"],
  },
  { label: "Users", href: "/users", roles: ["ADMIN"] },
];

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("user");
  if (!user) return null;

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function canAccessPath(role: UserRole, pathname: string) {
  const item = menuItems.find((menuItem) => menuItem.href === pathname);
  return item ? item.roles.includes(role) : true;
}

export function defaultPathForRole(role: UserRole) {
  if (role === "SALES") return "/leads";
  if (role === "MANAGER") return "/dashboard";
  return "/dashboard";
}

export function visibleMenuItems(role: UserRole) {
  return menuItems.filter((item) => item.roles.includes(role));
}
