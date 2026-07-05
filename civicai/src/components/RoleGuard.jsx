'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';

export default function RoleGuard({ children, allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) return null;

  const hasAccess = allowedRoles.some((role) => {
    if (role === 'admin' || role === 'Admin') {
      return user.role === 'Admin' || user.role === 'admin';
    }
    return user.role === role;
  });

  if (!hasAccess) return null;

  return children;
}
