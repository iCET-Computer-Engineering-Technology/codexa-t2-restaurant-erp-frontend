import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

type Role = string;

function normalizeRole(role: string | null | undefined): string {
  const trimmed = (role ?? '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  return upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`;
}

function normalizeRoles(roles: readonly Role[] | undefined): string[] {
  return (roles ?? []).map((r) => normalizeRole(r)).filter(Boolean);
}

/**
 * Role-based authorization guard.
 *
 * Usage:
 * - Add `canActivate: [roleGuard]` to a route.
 * - Optionally set `data: { roles: ['ROLE_ADMIN'] }`.
 *
 * Behavior:
 * - Not authenticated -> redirect to login (`/`).
 * - Authenticated + no roles required -> allow.
 * - Authenticated + roles required -> allow only if userRole matches.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/');
  }

  const requiredRoles = normalizeRoles(route.data?.['roles'] as Role[] | undefined);
  if (requiredRoles.length === 0) {
    return true;
  }

  const userRole = normalizeRole(auth.getRole());
  if (!userRole) {
    return router.parseUrl('/');
  }

  return requiredRoles.includes(userRole) ? true : router.parseUrl('/');
};

