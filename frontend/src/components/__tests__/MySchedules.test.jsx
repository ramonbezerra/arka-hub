import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import MySchedules from '../schedules/MySchedules';
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

describe('MySchedules', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads assignments and updates status', async () => {
        const user = userEvent.setup();
        axios.get
            .mockResolvedValueOnce({
                data: {
                    assignments: [
                        {
                            assignment: { id: 11, status: 'assigned' },
                            schedule: { title: 'June Worship' },
                            slot: { title: 'Sunday Morning' },
                        },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    assignments: [
                        {
                            assignment: { id: 11, status: 'confirmed' },
                            schedule: { title: 'June Worship' },
                            slot: { title: 'Sunday Morning' },
                        },
                    ],
                },
            });

        axios.patch.mockResolvedValueOnce({ data: {} });

        renderWithProviders(<MySchedules />, {
            route: '/my-schedules',
            token: createMockJwt({ role: 'member' }),
        });

        expect(await screen.findByText('June Worship - Sunday Morning')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        await waitFor(() => {
            expect(axios.patch).toHaveBeenCalledWith('/api/schedules/assignments/11', {
                status: 'confirmed',
            });
        });

        expect(await screen.findByText('Status: confirmed')).toBeInTheDocument();
    });
});
