'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'guru' | 'siswa' | 'kepala_sekolah' | 'operator' | 'tamu' | 'kajur' | 'waka_sarpras' | 'bendahara_bos' | 'teknisi';

// Cache for user roles to prevent repeated queries
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(() => {
    // Initialize from cache if available
    if (user?.id) {
      const cached = roleCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < ROLE_CACHE_DURATION) {
        return cached.role;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = roleCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < ROLE_CACHE_DURATION) {
      setRole(cached.role);
      setLoading(false);
      return;
    }

    // Hardcode Super Admin bypass
    if (user.email === 'kunbobo42@gmail.com') {
      setRole('admin');
      setLoading(false);
      return;
    }

    try {
      if (!user.db_id) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Fetch role with timeout
      const fetchPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.db_id)
        .maybeSingle();

      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      if (result === null) {
        // Timeout - use default
        setRole('tamu');
        setLoading(false);
        return;
      }

      const { data, error } = result;

      let userRole: UserRole = 'tamu';
      if (!error && data) {
        userRole = data.role as UserRole;
      }

      // Cache the result
      roleCache.set(user.id, {
        role: userRole,
        timestamp: Date.now(),
      });

      setRole(userRole);
    } catch {
      setRole('tamu');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return;
    }

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [user, authLoading, fetchUserRole]);

  const isAdmin = role === 'admin';
  const isGuru = role === 'guru';
  const isSiswa = role === 'siswa';
  const isKepalaSekolah = role === 'kepala_sekolah';
  const isOperator = role === 'operator';
  const isTeknisi = role === 'teknisi';

  return {
    role,
    loading: authLoading || loading,
    isAdmin,
    isGuru,
    isSiswa,
    isKepalaSekolah,
    isOperator,
    isTeknisi,
    refetch: fetchUserRole
  };
};
