import {
    LoginSchema,
    RegisterSchema,
    ProfileSchema,
    getMemberFormValidationSchema,
} from '../validationSchemas';

describe('LoginSchema', () => {
    it('rejects empty username', async () => {
        await expect(
            LoginSchema.validate({ username: '', password: 'abcd' })
        ).rejects.toThrow('Username is required');
    });

    it('rejects short password', async () => {
        await expect(
            LoginSchema.validate({ username: 'user1', password: 'abc' })
        ).rejects.toThrow('Password must be at least 4 characters');
    });

    it('accepts valid credentials', async () => {
        const result = await LoginSchema.validate({
            username: 'user1',
            password: 'secret',
        });
        expect(result.username).toBe('user1');
    });
});

describe('RegisterSchema', () => {
    it('rejects invalid email', async () => {
        await expect(
            RegisterSchema.validate({
                email: 'not-an-email',
                username: 'newuser',
                password: 'Secret1!',
            })
        ).rejects.toThrow('Invalid email');
    });

    it('rejects weak password', async () => {
        await expect(
            RegisterSchema.validate({
                email: 'user@example.com',
                username: 'newuser',
                password: 'password',
            })
        ).rejects.toThrow(
            'Password must contain at least one big letter, one small letter, one special character and one number'
        );
    });

    it('accepts valid registration data', async () => {
        const result = await RegisterSchema.validate({
            email: 'user@example.com',
            username: 'newuser',
            password: 'Secret1!',
        });
        expect(result.email).toBe('user@example.com');
    });
});

const validProfileFields = {
    fullname: 'Test User',
    email: 'user@example.com',
    gender: 'other',
    dateOfBirth: new Date(1995, 5, 15),
    cpf: '12345678901',
    phone: '11987654321',
    address: '123 Main St',
    city: 'City',
    state: 'ST',
    postalCode: '12345',
    servicePreferences: [],
};

describe('ProfileSchema', () => {
    it('rejects CPF with wrong length', async () => {
        await expect(
            ProfileSchema.validate({ ...validProfileFields, cpf: '123' })
        ).rejects.toThrow('CPF must have 11 digits');
    });

    it('accepts masked CPF after transform', async () => {
        const result = await ProfileSchema.validate({
            ...validProfileFields,
            cpf: '123.456.789-01',
        });
        expect(result.cpf).toBe('12345678901');
    });
});

const validMemberFields = {
    username: 'member1',
    email: 'member@example.com',
    password: 'secret',
    fullname: 'Member One',
    gender: 'other',
    dateOfBirth: new Date(1990, 0, 1),
    cpf: '12345678901',
    phone: '11987654321',
    address: '123 Main St',
    city: 'City',
    state: 'ST',
    country: 'BR',
    postalCode: '12345',
    servicePreferences: [],
};

describe('getMemberFormValidationSchema', () => {
    it('requires password when creating a member', async () => {
        const schema = getMemberFormValidationSchema(false);
        await expect(
            schema.validate({ ...validMemberFields, password: '' })
        ).rejects.toThrow('Password is required');
    });

    it('allows empty password when editing', async () => {
        const schema = getMemberFormValidationSchema(true);
        const { password, ...withoutPassword } = validMemberFields;
        const result = await schema.validate(withoutPassword);
        expect(result.username).toBe('member1');
    });
});
