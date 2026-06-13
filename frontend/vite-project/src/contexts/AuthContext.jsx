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

        const hydrateFromSession = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const urlToken = queryParams.get('token');
            
            let currentToken = token;
            if (urlToken) {
                currentToken = urlToken;
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            if (!currentToken && !storedSession.user) {
                setIsReady(true);
                return;
            }

            if (storedSession.user && !urlToken) {
                setIsReady(true);
                return;
            }

            try {
                const headers = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
                const response = await apiClient.get('/auth/me', { headers });

                if (!cancelled && response.data?.user) {
                    login(response.data.user, currentToken);
                }
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('authUser');
                    localStorage.removeItem('authToken');
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
