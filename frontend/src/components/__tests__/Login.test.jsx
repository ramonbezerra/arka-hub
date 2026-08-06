import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import Login from '../Login';
import { renderWithProviders } from '../../test-utils';

const mockNavigate = jest.fn();

jest.mock('../../api/client', () => ({
    __esModule: true,
    API_BASE_URL: 'http://test-api',
    default: {
        post: jest.fn(),
        get: jest.fn(),
        patch: jest.fn(),
        put: jest.fn(),
        defaults: { headers: { common: {} } },
    },
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('Login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows validation errors for empty submit', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />, { route: '/login' });

        await user.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByText('Username is required')).toBeInTheDocument();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('stores token and navigates on successful login', async () => {
        const user = userEvent.setup();
        axios.post.mockResolvedValueOnce({
            data: { access_token: 'new-access-token' },
        });

        renderWithProviders(<Login />, { route: '/login' });

        await user.type(screen.getByPlaceholderText('Enter your username'), 'member1');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'memberpass');
        await user.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
                username: 'member1',
                password: 'memberpass',
            });
        });

        expect(localStorage.getItem('token')).toBe('new-access-token');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('shows API error message on failed login', async () => {
        const user = userEvent.setup();
        axios.post.mockRejectedValueOnce({
            response: { data: { message: 'Invalid credentials' } },
        });

        renderWithProviders(<Login />, { route: '/login' });

        await user.type(screen.getByPlaceholderText('Enter your username'), 'member1');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
        await user.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    });

    it('shows network error when request fails without response', async () => {
        const user = userEvent.setup();
        axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK' });

        renderWithProviders(<Login />, { route: '/login' });

        await user.type(screen.getByPlaceholderText('Enter your username'), 'member1');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'memberpass');
        await user.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByText('Network error')).toBeInTheDocument();
    });
});
