import { Route } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import MinistryScheduleEditor from '../schedules/MinistryScheduleEditor';
import { renderWithRoutes } from '../../test-utils';
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

describe('MinistryScheduleEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a schedule and selects it', async () => {
        const user = userEvent.setup();

        let ministrySchedules = [];
        const scheduleDetail = {
            id: 91,
            title: 'June Worship',
            status: 'draft',
            slots: [],
        };

        axios.get.mockImplementation((url) => {
            if (String(url).includes('/api/ministries/') && String(url).includes('/schedules')) {
                return Promise.resolve({ data: { schedules: ministrySchedules } });
            }
            if (String(url).includes('/members')) {
                return Promise.resolve({
                    data: {
                        members: [{ userId: 1, username: 'vol1', fullName: 'Volunteer 1' }],
                    },
                });
            }
            if (String(url).includes('/api/schedules/')) {
                return Promise.resolve({ data: { schedule: scheduleDetail } });
            }
            return Promise.reject(new Error(`Unexpected GET ${url}`));
        });

        axios.post.mockImplementation((url, body) => {
            if (String(url).includes('/api/ministries/') && String(url).includes('/schedules')) {
                ministrySchedules = [
                    {
                        id: 91,
                        title: body.title,
                        status: 'draft',
                    },
                ];
                return Promise.resolve({
                    data: {
                        schedule: { id: 91, title: body.title, status: 'draft' },
                    },
                });
            }
            return Promise.reject(new Error(`Unexpected POST ${url}`));
        });

        renderWithRoutes(
            <Route
                path="/ministries/:ministryId/schedules"
                element={<MinistryScheduleEditor />}
            />,
            {
                route: '/ministries/7/schedules',
                token: createMockJwt({ role: 'member' }),
            }
        );

        await user.type(screen.getByLabelText('Schedule title'), 'June Worship');
        await user.type(screen.getByLabelText('Schedule start date'), '2026-06-01');
        await user.type(screen.getByLabelText('Schedule end date'), '2026-06-30');
        await user.click(screen.getByRole('button', { name: 'Create schedule' }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/ministries/7/schedules', {
                title: 'June Worship',
                startDate: '2026-06-01',
                endDate: '2026-06-30',
            });
        });

        expect(await screen.findByText('Selected schedule: June Worship')).toBeInTheDocument();
    });
});
