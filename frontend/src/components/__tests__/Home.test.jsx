import { screen } from '@testing-library/react';
import Home from '../Home';
import { renderWithProviders } from '../../test-utils';

describe('Home', () => {
    it('renders welcome message', () => {
        renderWithProviders(<Home />, { route: '/' });
        expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
        expect(
            screen.getByText('Welcome to the Arka Hub Platform!')
        ).toBeInTheDocument();
    });
});
