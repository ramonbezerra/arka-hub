import { datetimeLocalToIso } from '../scheduleApi';

describe('datetimeLocalToIso', () => {
    it('converts datetime-local to UTC ISO string with Z suffix', () => {
        const iso = datetimeLocalToIso('2026-06-07T09:00');
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
});
