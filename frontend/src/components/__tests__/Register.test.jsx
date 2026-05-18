import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import Register from '../Register';
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

describe('Register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows validation error for invalid email', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Register />, { route: '/register' });

        await user.type(screen.getByPlaceholderText('Enter your email'), 'bad-email');
        await user.type(screen.getByPlaceholderText('Choose an username'), 'newuser');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Secret1!');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByText('Invalid email')).toBeInTheDocument();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('navigates to login after successful registration', async () => {
        const user = userEvent.setup();
        axios.post.mockResolvedValueOnce({ data: { message: 'User registered successfully' } });

        renderWithProviders(<Register />, { route: '/register' });

        await user.type(screen.getByPlaceholderText('Enter your email'), 'user@example.com');
        await user.type(screen.getByPlaceholderText('Choose an username'), 'newuser');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Secret1!');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
                email: 'user@example.com',
                username: 'newuser',
                password: 'Secret1!',
            });
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('shows API error message on failed registration', async () => {
        const user = userEvent.setup();
        axios.post.mockRejectedValueOnce({
            response: { data: { message: 'User already exists' } },
        });

        renderWithProviders(<Register />, { route: '/register' });

        await user.type(screen.getByPlaceholderText('Enter your email'), 'user@example.com');
        await user.type(screen.getByPlaceholderText('Choose an username'), 'existing');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'Secret1!');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByText('User already exists')).toBeInTheDocument();
    });
});
