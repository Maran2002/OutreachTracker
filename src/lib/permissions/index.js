/**
 * Check if an admin has a required permission.
 * Always verified server-side — never trust client-provided permissions.
 * @param {string[]} adminPermissions
 * @param {string} required
 * @returns {boolean}
 */
export function hasPermission(adminPermissions, required) {
  return adminPermissions.includes(required);
}

/**
 * Check if an admin has ALL required permissions.
 * @param {string[]} adminPermissions
 * @param {string[]} required
 * @returns {boolean}
 */
export function hasAllPermissions(adminPermissions, required) {
  return required.every((p) => adminPermissions.includes(p));
}

/**
 * Check if an admin has ANY of the required permissions.
 * @param {string[]} adminPermissions
 * @param {string[]} required
 * @returns {boolean}
 */
export function hasAnyPermission(adminPermissions, required) {
  return required.some((p) => adminPermissions.includes(p));
}

/**
 * Return a 403 Response if admin lacks the required permission, else null.
 * @param {string[]} adminPermissions
 * @param {string} required
 * @returns {Response|null}
 */
export function requirePermission(adminPermissions, required) {
  if (!hasPermission(adminPermissions, required)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'FORBIDDEN', message: `Missing permission: ${required}` },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
