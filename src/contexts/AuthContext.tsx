import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
    id: string;
    userId: string;
    username: string;
    fullName: string;
    email: string;
    role: 'manager' | 'developer';
    seniorityLevel: string;
    loginAt?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on app start
    useEffect(() => {
        const restoreSession = async () => {
            try {
                if (window.api?.auth) {
                    const session = await window.api.auth.getCurrentUser();
                    setUser(session || null);
                }
            } catch (err) {
                console.error('Failed to restore session:', err);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        if (!window.api?.auth) throw new Error('Auth API not available');
        const userData = await window.api.auth.login(username, password);
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        try {
            if (window.api?.auth) {
                await window.api.auth.logout();
            }
        } finally {
            setUser(null);
        }
    }, []);

    const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        if (!window.api?.auth) throw new Error('Auth API not available');
        await window.api.auth.updatePassword(currentPassword, newPassword);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
            updatePassword,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
