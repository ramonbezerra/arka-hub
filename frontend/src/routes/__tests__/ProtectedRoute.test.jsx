import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { renderWithRoutes } from '../../test-utils';
import { createMockJwt } from '../../test/jwt';

describe('ProtectedRoute', () => {
    const routes = (
        <>
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<p>Secret dashboard</p>} />
            </Route>
            <Route path="/login" element={<p>Login page</p>} />
        </>
    );

    it('redirects to login when there is no token', () => {
        renderWithRoutes(routes, { route: '/dashboard' });
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('renders child route when token is present', () => {
        renderWithRoutes(routes, {
            route: '/dashboard',
            token: createMockJwt(),
        });
        expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
    });
});
