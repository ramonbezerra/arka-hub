import * as Yup from 'yup';
import { removeMask } from './masks';

export const LoginSchema = Yup.object().shape({
    username: Yup.string()
        .required('Username is required'),
    password: Yup.string()
        .min(4, 'Password must be at least 4 characters')
        .max(120, 'Password must not exceed 120 characters')
        .required('Password is required')
});

export const RegisterSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    username: Yup.string()
        .required('Username is required'),
    password: Yup.string()
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
            'Password must contain at least one big letter, one small letter, one special character and one number'
        )
        .min(8, 'Password must be at least 8 characters')
        .max(120, 'Password must not exceed 120 characters')
        .required('Password is required')
});

const cpfField = () =>
    Yup.string()
        .transform((value) => removeMask(value))
        .test('cpf-length', 'CPF must have 11 digits', (value) => {
            const cleaned = value ? value.replace(/\D/g, '') : '';
            return cleaned.length === 11;
        })
        .required('CPF is required');

const phoneField = () =>
    Yup.string()
        .transform((value) => removeMask(value))
        .test('phone-length', 'Phone must have 11 digits', (value) => {
            const cleaned = value ? value.replace(/\D/g, '') : '';
            return cleaned.length === 11;
        })
        .required('Phone is required');

export const ProfileSchema = Yup.object().shape({
    fullname: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    gender: Yup.string().required('Gender is required'),
    dateOfBirth: Yup.date()
        .required('Date of birth is required')
        .min(new Date(1900, 0, 1), 'Date of birth must be after 01/01/1900')
        .max(new Date(), "Date of birth must be before today's date"),
    cpf: cpfField(),
    phone: phoneField(),
    address: Yup.string().required('Address is required'),
    servicePreferences: Yup.array().of(Yup.string()),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    postalCode: Yup.string().required('Postal code is required'),
});

export const getMemberFormValidationSchema = (isEditing) =>
    Yup.object().shape({
        username: Yup.string().required('Username is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        password: isEditing
            ? Yup.string()
            : Yup.string().required('Password is required'),
        fullname: Yup.string().required('Name is required'),
        gender: Yup.string().required('Gender is required'),
        dateOfBirth: Yup.date()
            .required('Date of birth is required')
            .min(new Date(1900, 0, 1), 'Date of birth must be after 01/01/1900')
            .max(new Date(), "Date of birth must be before today's date"),
        cpf: cpfField(),
        phone: phoneField(),
        address: Yup.string().required('Address is required'),
        servicePreferences: Yup.array().of(Yup.string()),
        city: Yup.string().required('City is required'),
        state: Yup.string().required('State is required'),
        country: Yup.string().required('Country is required'),
        postalCode: Yup.string().required('Postal code is required'),
    });
