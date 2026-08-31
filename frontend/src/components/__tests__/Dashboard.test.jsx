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

    it('loads the user profile and shows ministry schedule cards', async () => {
        axios.get
            .mockResolvedValueOnce({ data: { username: 'admin', fullname: 'Admin User' } })
            .mockResolvedValueOnce({
                data: {
                    ministries: [
                        { id: 1, name: 'Worship', description: 'Praise team', isActive: true },
                        { id: 2, name: 'Youth', description: 'Youth support', isActive: true },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    ministry: { id: 1, name: 'Worship' },
                    schedules: [
                        { id: 10, title: 'June Worship', status: 'published', startDate: '2026-08-01', endDate: '2026-08-15', slots: [{ id: 1 }, { id: 2 }, { id: 3 }] },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    ministry: { id: 2, name: 'Youth' },
                    schedules: [
                        { id: 11, title: 'Youth Gathering', status: 'published', startDate: '2026-08-05', endDate: '2026-08-12', slots: [{ id: 1 }, { id: 2 }] },
                    ],
                },
            });

        renderWithProviders(<Dashboard />, {
            route: '/dashboard',
            token: createMockJwt({ role: 'admin' }),
        });

        expect(await screen.findByText('admin')).toBeInTheDocument();
        expect(await screen.findByText('Worship')).toBeInTheDocument();
        expect(await screen.findByText('June Worship')).toBeInTheDocument();
        expect(await screen.findByText('View schedule')).toBeInTheDocument();
    });

    it('limits the number of displayed schedules per ministry and renders a carousel', async () => {
        axios.get
            .mockResolvedValueOnce({ data: { username: 'admin', fullname: 'Admin User' } })
            .mockResolvedValueOnce({
                data: {
                    ministries: [{ id: 1, name: 'Worship', description: 'Praise team', isActive: true }],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    ministry: { id: 1, name: 'Worship' },
                    schedules: [
                        { id: 10, title: 'June Worship', status: 'published', startDate: '2026-08-01', endDate: '2026-08-15', slots: [{ id: 1 }, { id: 2 }] },
                        { id: 11, title: 'July Worship', status: 'published', startDate: '2026-07-01', endDate: '2026-07-15', slots: [{ id: 1 }, { id: 2 }, { id: 3 }] },
                        { id: 12, title: 'August Worship', status: 'published', startDate: '2026-09-01', endDate: '2026-09-15', slots: [{ id: 1 }] },
                        { id: 13, title: 'September Worship', status: 'published', startDate: '2026-10-01', endDate: '2026-10-15', slots: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] },
                    ],
                },
            });

        renderWithProviders(<Dashboard />, {
            route: '/dashboard',
            token: createMockJwt({ role: 'admin' }),
        });

        expect(await screen.findByText('Worship')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next ministry/i })).toBeInTheDocument();
        expect(screen.queryByText('September Worship')).not.toBeInTheDocument();
        expect(screen.getByText('View schedule')).toBeInTheDocument();
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
