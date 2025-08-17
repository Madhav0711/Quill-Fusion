'use client';

import { AuthUser } from '@supabase/supabase-js';
import { Subscription } from '../supabase/supabase.types';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from "@/util/supabase/client";
import { toast } from 'sonner';

type SupabaseUserContextType = {
  user: AuthUser | null;
  subscription: Subscription | null;
};

const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
  subscription: null,
});

export const useSupabaseUser = () => {
  return useContext(SupabaseUserContext);
};

interface SupabaseUserProviderProps {
  children: React.ReactNode;
}

export const SupabaseUserProvider: React.FC<SupabaseUserProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUserDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .in('status', ['trialing', 'active'])
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          toast.error('Unexpected Error', {
            description: 'Oops! An unexpected error happened. Try again later.',
          });
        }

        if (data) {
          setSubscription(data as Subscription);
        }
      }
    };

    getUserDetails();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getUserDetails();

        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSubscription(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, toast]);

  return (
    <SupabaseUserContext.Provider value={{ user, subscription }}>
      {children}
    </SupabaseUserContext.Provider>
  );
};