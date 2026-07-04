'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';

export default function RoleGuard({ children, allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) return null;

  const superAdminEmail = process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_EMAIL;
  const isSuper = superAdminEmail && user.email && user.email.toLowerCase() === superAdminEmail.toLowerCase();
  
  const hasAccess = allowedRoles.some((role) => {
    if (role === 'admin' || role === 'Admin') {
      return user.role === 'Admin' || user.role === 'admin' || isSuper;
    }
    return user.role === role;
  });

  if (!hasAccess && !isSuper) return null;

  return children;
}
