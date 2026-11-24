import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { showToast } from '../utils/toast';
import { setHasSeenOnboarding } from '../services/onboardingFlag';
import { useStudioStore } from '../store/useStudioStore';
import { useCanvasStore } from '../store/canvasStore';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  signOut: (options?: {
    navigateTo?: 'Welcome' | 'Login' | 'SignUp';
    navigation?: any;
  }) => Promise<void>;
  linkGuestAccount: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ data: any; error: any }>;
  deleteAccount: (options?: {
    navigation?: any;
  }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Intercept signUp for anonymous users so credentials link to the SAME user
const originalSignUp = supabase.auth.signUp.bind(supabase.auth);
supabase.auth.signUp = async (credentials) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (
      session?.user?.is_anonymous &&
      'email' in credentials &&
      credentials.email
    ) {
      const res = await supabase.auth.updateUser({
        email: credentials.email,
        password: credentials.password,
        data: credentials.options?.data,
      });
      if (res.data?.user && !res.error) {
        return {
          data: {
            user: res.data.user,
            session,
          },
          error: null,
        } as any;
      }
      return res as any;
    }
  } catch {}
  return originalSignUp(credentials);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial session lookup
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isMountedRef.current) {
          setSession(initialSession);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });

    // Subscribe to auth state changes and keep session state including SIGNED_OUT
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMountedRef.current) return;

      if (event === 'SIGNED_OUT' || !currentSession) {
        setSession(null);
      } else {
        setSession(currentSession);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearLocalUserData = async () => {
    try {
      const keysToClear = [
        '@voguecraft_local_sketches_v1',
        '@voguecraft_sync_queue_v1',
        '@voguecraft_local_board_v1',
        '@voguecraft_local_board_items_v1',
        '@voguecraft_saved_palettes_v2',
        '@voguecraft_user_profile_v1',
        '@voguecraft_user_stats_v1',
      ];
      await AsyncStorage.multiRemove(keysToClear);

      // Remove any sketch/techpack specific storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const entityKeys = allKeys.filter(
        (k) =>
          k.startsWith('@voguecraft_sketch_') ||
          k.startsWith('@voguecraft_tech_pack_')
      );
      if (entityKeys.length > 0) {
        await AsyncStorage.multiRemove(entityKeys);
      }

      // Keep onboarding flag true so onboarding is never shown again
      await setHasSeenOnboarding(true);

      // Reset in-memory store states
      useCanvasStore.setState({
        sketch: {
          id: '',
          title: 'Blank canvas',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canvasSize: { width: 400, height: 720 },
          layers: [],
          viewport: { scale: 1.0, translateX: 0, translateY: 0, rotation: 0 },
          guides: {
            dotGrid: true,
            centerLine: true,
            snapToGrid: false,
            proportionGuides: false,
          },
        },
        activeLayerId: 'layer_garment',
        isAutosaved: true,
      });

      useStudioStore.setState({
        activeSketch: null,
        activeTemplate: null,
        drawnStrokes: [],
      });
    } catch (err) {
      console.warn('VogueCraft: Error clearing local user data on sign out:', err);
    }
  };

  const signOut = useCallback(
    async (options?: {
      navigateTo?: 'Welcome' | 'Login' | 'SignUp';
      navigation?: any;
    }) => {
      if (isSigningOut) return;
      setIsSigningOut(true);

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err: any) {
        console.warn('VogueCraft: Supabase signOut error:', err);
        showToast('Sign out completed locally');
      } finally {
        await clearLocalUserData();

        if (isMountedRef.current) {
          setSession(null);
          setIsSigningOut(false);
        }

        const targetRoute = options?.navigateTo || 'Welcome';
        if (options?.navigation) {
          options.navigation.reset({
            index: 0,
            routes: [{ name: targetRoute }],
          });
        }
      }
    },
    [isSigningOut]
  );

  const linkGuestAccount = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        const { data, error } = await supabase.auth.updateUser({
          email: email.trim(),
          password,
          data: displayName ? { display_name: displayName.trim() } : undefined,
        });

        if (error) {
          showToast(error.message || 'Could not create account');
          return { data: null, error };
        }

        showToast('Account created successfully');
        return { data, error: null };
      } catch (err: any) {
        const msg = err?.message || 'Failed to create account';
        showToast(msg);
        return { data: null, error: err };
      }
    },
    []
  );

  const deleteAccount = useCallback(
    async (options?: { navigation?: any }) => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        const token = currentSession?.access_token;

        const { error } = await supabase.functions.invoke('delete-account', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (error) {
          showToast(error.message || 'Could not delete account');
          return { error };
        }

        if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
          try {
            const cachedFiles = await FileSystem.readDirectoryAsync(
              FileSystem.cacheDirectory
            );
            await Promise.all(
              cachedFiles.map((f) =>
                FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${f}`, {
                  idempotent: true,
                })
              )
            );
          } catch {}
        }

        await signOut({ navigateTo: 'Welcome', navigation: options?.navigation });
        showToast('Account deleted');
        return { error: null };
      } catch (err: any) {
        console.warn('VogueCraft: Account deletion error:', err?.message || err);
        showToast('Could not delete account');
        return { error: err };
      }
    },
    [signOut]
  );

  const user = session?.user || null;
  const isAnonymous = !!user?.is_anonymous;

  const value: AuthContextValue = {
    session,
    user,
    isAnonymous,
    isLoading,
    isSigningOut,
    signOut,
    linkGuestAccount,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
