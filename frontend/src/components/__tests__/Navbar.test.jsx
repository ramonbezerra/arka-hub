import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';
import { renderWithProviders } from '../../test-utils';
import { createMockJwt } from '../../test/jwt';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('Navbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows login link when not authenticated', () => {
        renderWithProviders(<Navbar />, { route: '/' });
        expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
    });

    it('shows profile and logout for authenticated member', () => {
        renderWithProviders(<Navbar />, {
            route: '/',
            token: createMockJwt({ role: 'member' }),
        });

        expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Members' })).not.toBeInTheDocument();
    });

    it('shows admin links for admin role', () => {
        renderWithProviders(<Navbar />, {
            route: '/',
            token: createMockJwt({ role: 'admin' }),
        });

        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Administrators' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Members' })).toBeInTheDocument();
    });

    it('clears token and navigates home on logout', async () => {
        const user = userEvent.setup();
        localStorage.setItem('token', createMockJwt({ role: 'member' }));

        renderWithProviders(<Navbar />, {
            route: '/',
            token: createMockJwt({ role: 'member' }),
        });

        await user.click(screen.getByRole('button', { name: 'Logout' }));

        expect(localStorage.getItem('token')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
