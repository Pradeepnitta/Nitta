import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = createContext(null);

const readStoredSession = () => {
    try {
        const storedUser = localStorage.getItem('authUser');
        const storedToken = localStorage.getItem('authToken');

        return {
            user: storedUser ? JSON.parse(storedUser) : null,
            token: storedToken || null
        };
    } catch {
        return {
            user: null,
            token: null
        };
    }
};

const resolveDashboardPath = (user) => {
    if (!user) {
        return '/auth';
    }

    return user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
};

export function AuthProvider({ children }) {
    const [storedSession] = useState(() => readStoredSession());
    const [user, setUser] = useState(storedSession.user);
    const [token, setToken] = useState(storedSession.token);
    const [isReady, setIsReady] = useState(Boolean(storedSession.user));

    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
            return;
        }

        delete apiClient.defaults.headers.common.Authorization;
    }, [token]);

    useEffect(() => {
        let cancelled = false;

        if (storedSession.user) {
            setIsReady(true);
            return () => {
                cancelled = true;
            };
        }

        const hydrateFromSession = async () => {
            try {
                const response = await apiClient.get('/auth/me');

                if (!cancelled && response.data?.user) {
                    setUser(response.data.user);
                    setToken(null);
                }
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setToken(null);
                }
            } finally {
                if (!cancelled) {
                    setIsReady(true);
                }
            }
        };

        hydrateFromSession();

        return () => {
            cancelled = true;
        };
    }, [storedSession.user]);

    const login = (nextUser, nextToken = null) => {
        setUser(nextUser);
        setToken(nextToken);

        localStorage.setItem('authUser', JSON.stringify(nextUser));

        if (nextToken) {
            localStorage.setItem('authToken', nextToken);
            apiClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
        } else {
            localStorage.removeItem('authToken');
            delete apiClient.defaults.headers.common.Authorization;
        }
    };

    const logout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // Clear local state even if the session endpoint is unavailable.
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authUser');
            localStorage.removeItem('authToken');
            delete apiClient.defaults.headers.common.Authorization;
        }
    };

    const value = useMemo(() => ({
        user,
        token,
        isReady,
        login,
        logout,
        resolveDashboardPath,
        isAuthenticated: Boolean(user)
    }), [user, token, isReady]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
