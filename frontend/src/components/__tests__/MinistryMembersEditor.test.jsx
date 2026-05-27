import { Route } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import { renderWithRoutes } from '../../test-utils';
import { createMockJwt } from '../../test/jwt';
import MinistryMembersEditor from '../ministries/MinistryMembersEditor';

jest.mock('../../api/client', () => ({
    __esModule: true,
    API_BASE_URL: 'http://test-api',
    default: {
        post: jest.fn(),
        get: jest.fn(),
        patch: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        defaults: { headers: { common: {} } },
    },
}));

describe('MinistryMembersEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('adds a member to ministry and reloads list', async () => {
        const user = userEvent.setup();

        let ministryMembers = [{ userId: 1, username: 'leader1', fullName: 'Leader', role: 'leader' }];

        axios.get.mockImplementation((url) => {
            if (String(url).includes('/api/ministries/7/members')) {
                return Promise.resolve({ data: { members: ministryMembers } });
            }
            if (String(url) === '/api/members') {
                return Promise.resolve({
                    data: { members: [{ username: 'member1', fullname: 'Member One' }] },
                });
            }
            return Promise.reject(new Error(`Unexpected GET ${url}`));
        });

        axios.post.mockImplementation((url, body) => {
            if (String(url).includes('/api/ministries/7/members')) {
                ministryMembers = [
                    ...ministryMembers,
                    { userId: 2, username: body.username, fullName: 'Member One', role: body.role },
                ];
                return Promise.resolve({ data: { member: { userId: 2 } } });
            }
            return Promise.reject(new Error(`Unexpected POST ${url}`));
        });

        renderWithRoutes(
            <Route path="/ministries/:ministryId/members" element={<MinistryMembersEditor />} />,
            { route: '/ministries/7/members', token: createMockJwt({ role: 'admin' }) }
        );

        expect(await screen.findByText('leader1 — leader')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Search members'), 'me');

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/members', { params: { search: 'me' } });
        });

        await user.selectOptions(screen.getByLabelText('Select member'), 'member1');
        await user.selectOptions(screen.getByLabelText('Role'), 'volunteer');
        await user.click(screen.getByRole('button', { name: 'Add to ministry' }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/ministries/7/members', {
                username: 'member1',
                role: 'volunteer',
            });
        });

        expect(await screen.findByText('member1 — volunteer')).toBeInTheDocument();
    });

    it('removes a member from ministry and reloads list', async () => {
        const user = userEvent.setup();

        let ministryMembers = [
            { userId: 1, username: 'member1', fullName: 'Member One', role: 'volunteer' },
        ];

        axios.get.mockImplementation((url) => {
            if (String(url).includes('/api/ministries/7/members')) {
                return Promise.resolve({ data: { members: ministryMembers } });
            }
            if (String(url) === '/api/members') {
                return Promise.resolve({ data: { members: [] } });
            }
            return Promise.reject(new Error(`Unexpected GET ${url}`));
        });

        axios.delete.mockImplementation((url) => {
            if (String(url).includes('/api/ministries/7/members/1')) {
                ministryMembers = [];
                return Promise.resolve({ data: {} });
            }
            return Promise.reject(new Error(`Unexpected DELETE ${url}`));
        });

        renderWithRoutes(
            <Route path="/ministries/:ministryId/members" element={<MinistryMembersEditor />} />,
            { route: '/ministries/7/members', token: createMockJwt({ role: 'admin' }) }
        );

        expect(await screen.findByText('member1 — volunteer')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Remove' }));

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith('/api/ministries/7/members/1');
        });

        expect(await screen.findByText('No members yet.')).toBeInTheDocument();
    });
});

