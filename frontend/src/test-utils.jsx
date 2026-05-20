import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './provider/authProvider';
import './i18n';
import i18n from './i18n';

export function renderWithProviders(ui, { route = '/', token } = {}) {
    if (token) {
        localStorage.setItem('token', token);
    }

    i18n.changeLanguage('en');

    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[route]}>
                {ui}
            </MemoryRouter>
        </AuthProvider>
    );
}

export function renderWithRoutes(routes, { route = '/', token } = {}) {
    if (token) {
        localStorage.setItem('token', token);
    }

    i18n.changeLanguage('en');

    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[route]}>
                <Routes>{routes}</Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

export { Route };
