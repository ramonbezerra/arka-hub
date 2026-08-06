import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from '../../api/client';
import AuthProvider, { useAuth } from '../authProvider';

function AuthConsumer() {
    const { token, setToken } = useAuth();
    return (
        <>
            <span data-testid="token">{token ?? 'none'}</span>
            <button type="button" onClick={() => setToken('test-token')}>
                Set token
            </button>
            <button type="button" onClick={() => setToken(null)}>
                Clear token
            </button>
        </>
    );
}

describe('AuthProvider', () => {
    it('loads token from localStorage on mount', () => {
        localStorage.setItem('token', 'stored-token');

        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('token')).toHaveTextContent('stored-token');
        expect(axios.defaults.headers.common.Authorization).toBe(
            'Bearer stored-token'
        );
    });

    it('persists token and sets axios header when setToken is called', async () => {
        const user = userEvent.setup();

        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await user.click(screen.getByRole('button', { name: 'Set token' }));

        expect(screen.getByTestId('token')).toHaveTextContent('test-token');
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(axios.defaults.headers.common.Authorization).toBe(
            'Bearer test-token'
        );
    });

    it('clears token and axios header when setToken(null) is called', async () => {
        const user = userEvent.setup();
        localStorage.setItem('token', 'stored-token');

        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await user.click(screen.getByRole('button', { name: 'Clear token' }));

        expect(screen.getByTestId('token')).toHaveTextContent('none');
        expect(localStorage.getItem('token')).toBeNull();
        expect(axios.defaults.headers.common.Authorization).toBeUndefined();
    });
});
