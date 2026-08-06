import { screen, waitFor } from '@testing-library/react';
import axios from '../../api/client';
import Dashboard from '../Dashboard';
import { renderWithProviders } from '../../test-utils';
import { createMockJwt } from '../../test/jwt';

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

describe('Dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows error when there is no token', async () => {
        renderWithProviders(<Dashboard />, { route: '/dashboard' });

        expect(
            await screen.findByText('No authentication token found')
        ).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('loads and displays username when profile request succeeds', async () => {
        axios.get.mockResolvedValueOnce({
            data: { username: 'admin', fullname: 'Admin User' },
        });

        renderWithProviders(<Dashboard />, {
            route: '/dashboard',
            token: createMockJwt({ role: 'admin' }),
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/users/profile');
        });

        expect(await screen.findByText('admin')).toBeInTheDocument();
    });

    it('shows error when profile request fails', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network error'));

        renderWithProviders(<Dashboard />, {
            route: '/dashboard',
            token: createMockJwt({ role: 'admin' }),
        });

        expect(await screen.findByText('Failed to load data.')).toBeInTheDocument();
    });
});
