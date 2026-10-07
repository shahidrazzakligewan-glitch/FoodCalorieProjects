import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const formatAuthError = (error) => {
    const message = error?.message || '';
    const normalizedMessage = message.toLowerCase();

    if (
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('err_name_not_resolved')
    ) {
        return {
            ...error,
            message: 'Cannot reach Supabase. Check the project URL, project status, and network connection.'
        };
    }

    return error || { message: 'Unable to reach the authentication service.' };
};

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const initRef = useRef(false);

    const fetchProfile = async (userId, emailOverride = '') => {
        if (!userId) {
            setUserProfile(null);
            return;
        }

        if (!supabase) {
            setUserProfile({ id: userId, email: emailOverride, role: 'user' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                const { data: sessionData } = await supabase.auth.getSession();
                const sessionUser = sessionData?.session?.user;

                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        email: sessionUser?.email || emailOverride,
                        role: 'user',
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (!createError) {
                    setUserProfile(newProfile);
                    return;
                }
            }

            if (data) {
                setUserProfile(data);
            } else {
                setUserProfile({ id: userId, email: emailOverride, role: 'user' });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setUserProfile({ id: userId, email: emailOverride, role: 'user' });
        }
    };

    useEffect(() => {
        let sessionInterval = null;

        const initializeAuth = async () => {
            if (!supabase) {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
                initRef.current = true;
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email);
                    startSession(session.user.id);
                }
            } catch (error) {
                console.warn('Supabase session restore failed, using local demo mode.', error);
                setUser(null);
                setUserProfile(null);
            } finally {
                setLoading(false);
                initRef.current = true;
            }
        };

        const startSession = async (userId) => {
            if (!supabase) return;

            const sessionStartTime = Date.now();
            try {
                const { data, error } = await supabase.from('user_sessions').insert([{
                    user_id: userId,
                    login_at: new Date(sessionStartTime).toISOString(),
                    last_active_at: new Date(sessionStartTime).toISOString(),
                    duration_minutes: 0,
                    pages_visited: 1
                }]).select().single();

                if (error) console.error('Session insert error:', error);
                if (data) {
                    const currentSessionId = data.id;
                    sessionInterval = setInterval(async () => {
                        if (currentSessionId) {
                            await supabase.from('user_sessions')
                                .update({
                                    last_active_at: new Date().toISOString(),
                                    duration_minutes: Math.round((Date.now() - sessionStartTime) / 60000)
                                })
                                .eq('id', currentSessionId)
                                .catch(() => {});
                        }
                    }, 60000);
                }
            } catch (e) {
                console.warn('Session tracking failed:', e);
            }
        };

        initializeAuth();

        if (!supabase) {
            return () => {
                if (sessionInterval) clearInterval(sessionInterval);
            };
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!initRef.current) return;

                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email);
                    if (_event === 'SIGNED_IN') {
                        startSession(session.user.id);
                    }
                } else {
                    setUserProfile(null);
                    if (sessionInterval) clearInterval(sessionInterval);
                }
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
            if (sessionInterval) clearInterval(sessionInterval);
        };
    }, []);

    const signUp = async (email, password, fullName) => {
        if (!supabase) {
            return {
                data: null,
                error: { message: 'Authentication is not configured. Set a valid Supabase URL and anon key.' }
            };
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            });
            return { data, error: error ? formatAuthError(error) : null };
        } catch (error) {
            return { data: null, error: formatAuthError(error) };
        }
    };

    const signIn = async (email, password) => {
        if (!supabase) {
            return {
                data: null,
                error: { message: 'Authentication is not configured. Set a valid Supabase URL and anon key.' }
            };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            return { data, error: error ? formatAuthError(error) : null };
        } catch (error) {
            return { data: null, error: formatAuthError(error) };
        }
    };

    const signInWithGoogle = async () => {
        if (!supabase) {
            return {
                data: null,
                error: { message: 'Authentication is not configured. Set a valid Supabase URL and anon key.' }
            };
        }

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/signin',
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
            return { data, error: error ? formatAuthError(error) : null };
        } catch (error) {
            return { data: null, error: formatAuthError(error) };
        }
    };

    const signOut = async () => {
        setUser(null);
        setUserProfile(null);

        if (!supabase) {
            return { error: null };
        }

        try {
            const { error } = await supabase.auth.signOut();
            return { error };
        } catch {
            return { error: { message: 'Unable to reach the authentication service.' } };
        }
    };

    const resetPassword = async (email) => {
        if (!supabase) {
            return {
                data: null,
                error: { message: 'Authentication is not configured. Set a valid Supabase URL and anon key.' }
            };
        }

        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });
            return { data, error: error ? formatAuthError(error) : null };
        } catch (error) {
            return {
                data: null,
                error: formatAuthError(error)
            };
        }
    };

    const updatePassword = async (newPassword) => {
        if (!supabase) {
            return {
                data: null,
                error: { message: 'Authentication is not configured. Set a valid Supabase URL and anon key.' }
            };
        }

        try {
            const { data, error } = await supabase.auth.updateUser({ password: newPassword });
            return { data, error: error ? formatAuthError(error) : null };
        } catch (error) {
            return {
                data: null,
                error: formatAuthError(error)
            };
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        fetchProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
