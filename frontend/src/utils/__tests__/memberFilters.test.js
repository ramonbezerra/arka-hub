import { EMPTY_FILTERS, hasActiveFilters } from '../memberFilters';

describe('hasActiveFilters', () => {
    it('returns true when showInactive is enabled', () => {
        expect(hasActiveFilters(EMPTY_FILTERS, true)).toBe(true);
    });

    it('returns false when all filters are empty', () => {
        expect(hasActiveFilters(EMPTY_FILTERS, false)).toBe(false);
    });

    it('returns true when a string filter is set', () => {
        expect(hasActiveFilters({ ...EMPTY_FILTERS, fullname: 'Ana' }, false)).toBe(true);
    });

    it('returns true when an array filter has values', () => {
        expect(
            hasActiveFilters({ ...EMPTY_FILTERS, gender: ['female'] }, false)
        ).toBe(true);
    });
});
