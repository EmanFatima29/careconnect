/**
 * Role Utilities
 * Shared role inference logic for patient/doctor/admin role-based UI.
 */

/**
 * Normalize roles value (string or array) into a consistent array.
 * @param {string|string[]|null} roles
 * @returns {string[]}
 */
export function coerceRoles(roles) {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.filter(Boolean).map(String);
  if (typeof roles === "string") {
    return roles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Infer the user's primary role for UI rendering.
 * @param {string|string[]|null} sessionRoles - from currentUser.roles or session.user.roles
 * @returns {"admin"|"doctor"|"pharmacy"|"patient"}
 */
export function inferRole(sessionRoles) {
  const roles = coerceRoles(sessionRoles).map((r) => r.toLowerCase());

  if (roles.some((r) => r.includes("admin") || r.includes("superadmin"))) {
    return "admin";
  }

  if (roles.some((r) => r.includes("doctor"))) {
    return "doctor";
  }

  if (roles.some((r) => r.includes("pharmacy"))) {
    return "pharmacy";
  }

  return "patient";
}

/**
 * Check if current user has admin-level access.
 * @param {string|string[]|null} sessionRoles
 * @returns {boolean}
 */
export function isAdmin(sessionRoles) {
  return inferRole(sessionRoles) === "admin";
}

/**
 * Check if current user is a doctor.
 * @param {string|string[]|null} sessionRoles
 * @returns {boolean}
 */
export function isDoctor(sessionRoles) {
  return inferRole(sessionRoles) === "doctor";
}

/**
 * Check if current user is a patient (non-admin, non-doctor, non-pharmacy).
 * @param {string|string[]|null} sessionRoles
 * @returns {boolean}
 */
export function isPatient(sessionRoles) {
  return inferRole(sessionRoles) === "patient";
}

/**
 * Check if current user is a pharmacy.
 * @param {string|string[]|null} sessionRoles
 * @returns {boolean}
 */
export function isPharmacy(sessionRoles) {
  return inferRole(sessionRoles) === "pharmacy";
}
