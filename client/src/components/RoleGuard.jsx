"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { inferRole, isAdmin, isPatient } from "@/utils/roleUtils";

/**
 * RoleGuard — client-side route guard component.
 *
 * Wraps page content and verifies that the authenticated user
 * holds one of the `allowedRoles`.  If the session is still loading
 * a centered spinner is shown; if the user lacks the required role
 * they are redirected to their role-appropriate dashboard.
 *
 * @param {Object}  props
 * @param {"admin"|"patient"|string[]} props.allowedRoles
 *        A single role string or an array of role strings.
 *        Compared against the inferred role from `session.user.roles`.
 * @param {string}  [props.fallbackUrl]  Override redirect URL on denial.
 * @param {React.ReactNode} props.children
 */
export default function RoleGuard({ allowedRoles, fallbackUrl, children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Normalize allowedRoles to an array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  useEffect(() => {
    if (status === "loading") return; // wait for session

    // Not authenticated → middleware normally catches this,
    // but as a safety net redirect to login.
    if (status === "unauthenticated" || !session) {
      router.replace("/login");
      return;
    }

    const userRole = inferRole(session.user?.roles);

    if (roles.includes(userRole)) {
      setAuthorized(true);
      return;
    }

    // Unauthorized — redirect to fallback or role-appropriate page
    const redirectTo =
      fallbackUrl || (userRole === "admin" ? "/dashboard" : "/dashboard");
    router.replace(redirectTo);
  }, [status, session, router, roles, fallbackUrl]);

  // ── Loading state ────────────────────────────────────
  if (status === "loading" || !authorized) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress size={36} />
        <Typography variant="body2" color="text.secondary">
          Checking access…
        </Typography>
      </Box>
    );
  }

  // ── Authorized ───────────────────────────────────────
  return children;
}
