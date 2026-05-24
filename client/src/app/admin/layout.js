"use client";

import RoleGuard from "@/components/RoleGuard";

/**
 * Admin layout — wraps all /admin/* pages with an admin-only RoleGuard.
 * Patients are redirected to /dashboard by the middleware + RoleGuard combo.
 */
export default function AdminLayout({ children }) {
  return <RoleGuard allowedRoles="admin">{children}</RoleGuard>;
}
