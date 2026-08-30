'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase/client';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, nama: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let supabaseUserId = null;
        try {
          // 1. Check if user exists in `users` table
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, nama')
            .eq('auth_id', firebaseUser.uid)
            .maybeSingle();

          supabaseUserId = existingUser?.id;
          let userNama = existingUser?.nama;

          if (!existingUser) {
            // Insert new user
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                auth_id: firebaseUser.uid,
                email: firebaseUser.email,
                nama: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              })
              .select('id, nama')
              .single();
              
            if (!insertError && newUser) {
              supabaseUserId = newUser.id;
              userNama = newUser.nama;
            }
          }

          // 2. Check if user has a role in `user_roles`
          if (supabaseUserId && firebaseUser.email) {
            const { data: existingRole } = await supabase
              .from('user_roles')
              .select('id')
              .eq('user_id', supabaseUserId)
              .maybeSingle();

            if (!existingRole) {
              // 3. Check if email exists in `siswa` table
              const { data: matchedSiswa } = await supabase
                .from('siswa')
                .select('id')
                .eq('email', firebaseUser.email)
                .maybeSingle();

              if (matchedSiswa) {
                // Auto-link: assign 'siswa' role
                await supabase
                  .from('user_roles')
                  .insert({
                    user_id: supabaseUserId,
                    role: 'siswa'
                  });
              }
            }
          }
        } catch (error) {
          console.error("Error syncing user to Supabase:", error);
        }

        const mappedUser = {
          id: firebaseUser.uid,
          db_id: supabaseUserId, // Set right away
          email: firebaseUser.email,
          nama: userNama || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          user_metadata: {
            full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            avatar_url: firebaseUser.photoURL
          }
        };
        setUser(mappedUser);
        setSession({ user: mappedUser });

      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user }, error: null };
  };

  const signUp = async (email: string, password: string, nama: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user }, error: null };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};