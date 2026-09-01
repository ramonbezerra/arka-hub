import axios from '../api/client';
import { useEffect, useState, createContext, useContext, useMemo } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [token, setToken_] = useState(() => {
        const savedToken = localStorage.getItem('token');
        return savedToken && savedToken !== 'null' ? savedToken : null;
    });
    const [refreshToken, setRefreshToken_] = useState(() => {
        const savedRefreshToken = localStorage.getItem('refresh_token');
        return savedRefreshToken && savedRefreshToken !== 'null' ? savedRefreshToken : null;
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

    const setRefreshToken = (newRefreshToken) => {
        if (newRefreshToken) {
            setRefreshToken_(newRefreshToken);
            localStorage.setItem('refresh_token', newRefreshToken);
        } else {
            setRefreshToken_(null);
            localStorage.removeItem('refresh_token');
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

    useEffect(() => {
        if (refreshToken != null && refreshToken !== 'null') {
            localStorage.setItem('refresh_token', refreshToken);
        } else {
            localStorage.removeItem('refresh_token');
        }
    }, [refreshToken]);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    const currentRefreshToken = localStorage.getItem('refresh_token');
                    if (!currentRefreshToken) {
                        setToken(null);
                        setRefreshToken(null);
                        return Promise.reject(error);
                    }

                    try {
                        const response = await axios.post(
                            '/api/auth/refresh',
                            {},
                            {
                                headers: {
                                    Authorization: `Bearer ${currentRefreshToken}`,
                                },
                            },
                        );

                        const newAccessToken = response.data.access_token;
                        const newRefreshToken = response.data.refresh_token || currentRefreshToken;

                        setToken(newAccessToken);
                        setRefreshToken(newRefreshToken);

                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        setToken(null);
                        setRefreshToken(null);
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            },
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const value = useMemo(() => ({ token, refreshToken, setToken, setRefreshToken }), [token, refreshToken]);

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
