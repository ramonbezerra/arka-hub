import axios from 'axios';
import { useEffect, useState, createContext, useContext, useMemo } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [token, setToken_] = useState(() => {
        const savedToken = localStorage.getItem('token');
        return savedToken && savedToken !== 'null' ? savedToken : null;
    });

    const setToken = (newToken) => {
        if (newToken) {
            setToken_(newToken);
            localStorage.setItem('token', newToken);
            axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        } else {
            setToken_(null);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common.Authorization;
        }
    };

    useEffect(() => {
        if (token != null && token !== "null") {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common.Authorization;
            localStorage.removeItem('token');
        }
    }, [token]);

    const value = useMemo(() => ({ token, setToken }), [token]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
}

export default AuthProvider;
