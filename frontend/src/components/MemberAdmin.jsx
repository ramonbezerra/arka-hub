import { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import MaskedInput from 'react-text-mask';

// Função para remover máscaras
const removeMask = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
};

// Função para aplicar máscara no CPF para exibição
const applyCpfMask = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

// Função para aplicar máscara no telefone para exibição
const applyPhoneMask = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

const EnrollSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
    fullname: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    gender: Yup.string().required('Gender is required'),
    dateOfBirth: Yup.date()
        .required('Date of birth is required')
        .min(new Date(1900, 0, 1), 'Date of birth must be after 01/01/1900')
        .max(new Date(), 'Date of birth must be before today\'s date'),
    cpf: Yup.string()
        .transform(value => removeMask(value))
        .test('cpf-length', 'CPF must have 11 digits', value => {
            const cleaned = value ? value.replace(/\D/g, '') : '';
            return cleaned.length === 11;
        })
        .required('CPF is required'),
    phone: Yup.string()
        .transform(value => removeMask(value))
        .test('phone-length', 'Phone must have 11 digits', value => {
            const cleaned = value ? value.replace(/\D/g, '') : '';
            return cleaned.length === 11;
        })
        .required('Phone is required'),
    address: Yup.string().required('Address is required'),
    servicePreferences: Yup.array().of(Yup.string()),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    country: Yup.string().required('Country is required'),
    postalCode: Yup.string().required('Postal code is required'),
});

const phoneMask = [
    "(",
    /[1-9]/,
    /\d/,
    ")",
    " ",
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    /\d/
];

const cpfMask = [
    /[0-9]/,
    /\d/,
    /\d/,
    ".",
    /\d/,
    /\d/,
    /\d/,
    ".",
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/
];

const servicePreferencesOptions = [
    { value: 'children', label: 'Children' },
    { value: 'women', label: 'Women' },
    { value: 'youth', label: 'Youth' },
    { value: 'worship', label: 'Worship' },
    { value: 'welcome', label: 'Welcome' }
];

const MemberAdmin = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchMembers = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('http://localhost:5000/api/members');
            setMembers(response.data.members || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleSubmit = async (values, { resetForm, setSubmitting }) => {
        setError('');
        setSuccess('');
        setSubmitting(true);

        const cleanedValues = {
            ...values,
            cpf: removeMask(values.cpf),
            phone: removeMask(values.phone),
            servicePreferences: values.servicePreferences || []
        };

        try {
            await axios.post('http://localhost:5000/api/members', cleanedValues);
            setSuccess('Member enrolled successfully');
            resetForm();
            fetchMembers();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to enroll member');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="">
            <div className="">
                <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                    <div className="items-center text-gray-600 p-4">
                        <h1 className="lg:text-3xl md:text-2xl text-xl">
                            Member Management
                        </h1>
                    </div>
                    
                    {error && <div className="text-red-500 mb-2 px-4">{error}</div>}
                    {success && <div className="text-green-500 mb-2 px-4">{success}</div>}

                    <div className="p-4 border-t border-gray-300">
                        <h2 className="text-2xl mb-4 text-gray-700">Enroll New Member</h2>
                        <Formik
                            initialValues={{
                                username: '',
                                email: '',
                                password: '',
                                fullname: '',
                                phone: '',
                                cpf: '',
                                gender: '',
                                dateOfBirth: '',
                                address: '',
                                city: '',
                                state: '',
                                country: '',
                                postalCode: '',
                                servicePreferences: []
                            }}
                            validationSchema={EnrollSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ values, isSubmitting, setFieldValue }) => (
                                <Form className="space-y-4">
                                    <div className="grid lg:grid-cols-2 gap-4">
                                        <div className="mb-4">
                                            <label htmlFor="username" className="block font-medium mb-1">Username
                                                <ErrorMessage name="username" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="username" 
                                                name="username" 
                                                placeholder="Username"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="email" className="block font-medium mb-1">Email
                                                <ErrorMessage name="email" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="email" 
                                                name="email" 
                                                type="email" 
                                                placeholder="Email"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="password" className="block font-medium mb-1">Password
                                                <ErrorMessage name="password" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="password" 
                                                name="password" 
                                                type="password" 
                                                placeholder="Password"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="fullname" className="block font-medium mb-1">Full Name
                                                <ErrorMessage name="fullname" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="fullname" 
                                                name="fullname" 
                                                placeholder="Full Name"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="cpf" className="block font-medium mb-1">CPF
                                                <ErrorMessage name="cpf" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field name="cpf">
                                                {({ field }) => (
                                                    <MaskedInput        
                                                        {...field}  
                                                        id="cpf"                               
                                                        mask={cpfMask}
                                                        type="text"
                                                        className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                        placeholder="e.g.: 999.999.999-99"
                                                        value={field.value || ""}
                                                        onChange={(e) => {
                                                            setFieldValue('cpf', e.target.value);
                                                        }}
                                                        onBlur={field.onBlur}
                                                    />
                                                )}
                                            </Field>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="phone" className="block font-medium mb-1">Phone
                                                <ErrorMessage name="phone" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field name="phone">
                                                {({ field }) => (
                                                    <MaskedInput        
                                                        {...field}  
                                                        id="phone"                               
                                                        mask={phoneMask}
                                                        type="text"
                                                        className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                        placeholder="e.g.: (99) 99999-9999"
                                                        value={field.value || ""}
                                                        onChange={(e) => {
                                                            setFieldValue('phone', e.target.value);
                                                        }}
                                                        onBlur={field.onBlur}
                                                    />
                                                )}
                                            </Field>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="gender" className="block font-medium mb-1">Gender
                                                <ErrorMessage name="gender" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <div className="mt-2 space-x-4">
                                                <label className="inline-flex items-center">
                                                    <Field
                                                        type="radio"
                                                        className="form-radio"
                                                        name="gender"
                                                        value="male"
                                                    />
                                                    <span className="ml-2">Male</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <Field
                                                        type="radio"
                                                        className="form-radio"
                                                        name="gender"
                                                        value="female"
                                                    />
                                                    <span className="ml-2">Female</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <Field
                                                        type="radio"
                                                        className="form-radio"
                                                        name="gender"
                                                        value="other"
                                                    />
                                                    <span className="ml-2">Other</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="dateOfBirth" className="block font-medium mb-1">Date of Birth
                                                <ErrorMessage name="dateOfBirth" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="dateOfBirth" 
                                                name="dateOfBirth" 
                                                type="date"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="postalCode" className="block font-medium mb-1">Postal Code
                                                <ErrorMessage name="postalCode" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="postalCode" 
                                                name="postalCode" 
                                                placeholder="e.g.: 99999999"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="address" className="block font-medium mb-1">Address
                                                <ErrorMessage name="address" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="address" 
                                                name="address" 
                                                placeholder="Enter address"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="city" className="block font-medium mb-1">City
                                                <ErrorMessage name="city" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="city" 
                                                name="city" 
                                                placeholder="Enter city"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="state" className="block font-medium mb-1">State
                                                <ErrorMessage name="state" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="state" 
                                                name="state" 
                                                placeholder="Enter state"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="country" className="block font-medium mb-1">Country
                                                <ErrorMessage name="country" component="span" className="text-red-500 ml-4" />
                                            </label>
                                            <Field 
                                                id="country" 
                                                name="country" 
                                                placeholder="Enter country"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block font-medium mb-2">Service Preferences</span>
                                        <div className="grid lg:grid-cols-5 gap-2">
                                            {servicePreferencesOptions.map((option) => (
                                                <label key={option.value} className="inline-flex items-center bg-white border border-gray-300 rounded-md px-3 py-2">
                                                    <Field
                                                        type="checkbox"
                                                        name="servicePreferences"
                                                        value={option.value}
                                                        className="form-checkbox h-4 w-4 text-blue-600"
                                                    />
                                                    <span className="ml-2">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Enrolling...' : 'Enroll Member'}
                                    </button>
                                </Form>
                            )}
                        </Formik>
                    </div>

                    <div className="p-4 border-t border-gray-300">
                        <h2 className="text-2xl mb-4 text-gray-700">Member List</h2>
                        {loading ? (
                            <p className="text-gray-600">Loading members…</p>
                        ) : (
                            <div>
                                {members.length === 0 ? (
                                    <p className="text-gray-600">No members found.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead className="bg-gray-200">
                                                <tr>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Preferences</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {members.map((member) => (
                                                    <tr key={member.username} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-4 py-2">{member.username}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{member.fullname}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{member.email}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{member.phone}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{member.servicePreferences?.join(', ') || 'None'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MemberAdmin;
