const base64url = (obj) =>
    btoa(JSON.stringify(obj))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

export function createMockJwt(claims = {}) {
    const header = base64url({ alg: 'HS256', typ: 'JWT' });
    const payload = base64url({
        role: 'member',
        is_active: true,
        ...claims,
    });
    return `${header}.${payload}.mock-signature`;
}
