/**
 * Converts HTML datetime-local value (YYYY-MM-DDTHH:mm) to ISO-8601 for the API.
 */
export function datetimeLocalToIso(value) {
    if (!value || typeof value !== 'string') {
        return value;
    }
    const normalized = value.length === 16 ? `${value}:00` : value;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) {
        return value;
    }
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
