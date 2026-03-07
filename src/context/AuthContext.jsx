import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const BASE_URL = import.meta.env.VITE_APP_API_URL;

/**
 * Call the getAgentByToken endpoint to fetch full user profile.
 * This gives us DesigId, Department, Designatation, ManagerName etc.
 */
const fetchUserProfile = async (token) => {
    try {
        const res = await axios.get(`${BASE_URL}/v1/agent/auth/getAgentByToken`, {
            headers: { genie_access_token: `Bearer ${token}` },
        });
        // API returns { error: false, data: { User: {...} } }
        const user = res.data?.data?.User ?? res.data?.data ?? res.data?.User ?? null;
        return user;
    } catch (err) {
        console.warn('getAgentByToken failed, falling back to JWT payload', err?.response?.data);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userLoading, setUserLoading] = useState(false);

    const resolveUser = async (tok) => {
        if (!tok || tok === 'demo-token') return;

        setUserLoading(true);
        try {
            // 1. Validate JWT first (expiry check)
            const decoded = jwtDecode(tok);
            if (decoded.exp < Date.now() / 1000) {
                logout();
                return;
            }

            // 2. Try fetching full profile from API
            const profile = await fetchUserProfile(tok);

            if (profile) {
                setUser(profile);
            } else {
                // Fallback: use JWT payload (unwrap User key if nested)
                const userData = decoded?.User ?? decoded;
                setUser({ ...userData });
            }
        } catch {
            logout();
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        if (!token) { setUser(null); return; }

        if (token === 'demo-token') {
            setUser({
                appUserId: 'DEMO',
                username: 'Demo User',
                email: 'demo@forzamedi.com',
                DesigId: 6,
                Designatation: 'HR Manager',
                Department: 'Human Resource',
            });
            return;
        }

        resolveUser(token);
    }, [token]);

    const login = async (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // Eagerly fetch profile right after login
        await resolveUser(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, userLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
