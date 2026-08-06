import { Route } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import { renderWithRoutes } from '../../test-utils';
import { createMockJwt } from '../../test/jwt';
import MinistryList from '../ministries/MinistryList';

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

describe('MinistryList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders ministries and management links', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                ministries: [
                    { id: 1, name: 'Louvor', isActive: true },
                    { id: 2, name: 'Mídia', isActive: false },
                ],
            },
        });

        renderWithRoutes(
            <Route path="/ministries" element={<MinistryList />} />,
            { route: '/ministries', token: createMockJwt({ role: 'admin' }) }
        );

        expect(await screen.findByText('Louvor')).toBeInTheDocument();
        expect(screen.getByText('Mídia')).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Manage members' })[0]).toHaveAttribute(
            'href',
            '/ministries/1/members'
        );
    });

    it('creates a ministry from the UI', async () => {
        const user = userEvent.setup();

        axios.get
            .mockResolvedValueOnce({ data: { ministries: [] } })
            .mockResolvedValueOnce({
                data: {
                    ministries: [{ id: 99, name: 'Intercessão', isActive: true }],
                },
            });
        axios.post.mockResolvedValueOnce({ data: { ministry: { id: 99 } } });

        renderWithRoutes(
            <Route path="/ministries" element={<MinistryList />} />,
            { route: '/ministries', token: createMockJwt({ role: 'admin' }) }
        );

        await user.type(screen.getByLabelText('Name'), 'Intercessão');
        await user.type(screen.getByLabelText('Description'), 'Prayer ministry');
        await user.click(screen.getByRole('button', { name: 'Create ministry' }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/ministries/', {
                name: 'Intercessão',
                description: 'Prayer ministry',
            });
        });

        expect(
            await screen.findByText('Ministry created successfully')
        ).toBeInTheDocument();
        expect(await screen.findByText('Intercessão')).toBeInTheDocument();
    });
});

