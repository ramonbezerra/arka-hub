import { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import axios from '../../api/client';
import { getMemberFormValidationSchema } from '../../utils/validationSchemas';
import { removeMask } from '../../utils/masks';
import { useNavigate, useParams } from 'react-router-dom';
import MaskedInput from 'react-text-mask';
import { useTranslation } from 'react-i18next';

const applyCpfMask = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const applyPhoneMask = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

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

const MemberForm = () => {
    const [loading, setLoading] = useState(true);
    const [memberData, setMemberData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { username } = useParams();
    const isEditing = !!username; 
    const [initialValues, setInitialValues] = useState({
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
    });

    useEffect(() => {
        if (isEditing) {
            fetchMember();
        } else {
            setLoading(false);
        }
    }, [isEditing, username]);

    const fetchMember = async () => {
        try {
            const response = await axios.get(`/api/members/${username}`);
            const member = response.data.member;
            setMemberData(member);
            setInitialValues({
                username: member.username || '',
                email: member.email || '',
                password: '',
                fullname: member.fullname || '',
                phone: member.phone || '',
                cpf: member.cpf || '',
                gender: member.gender || '',
                dateOfBirth: member.dateOfBirth || '',
                address: member.address || '',
                city: member.city || '',
                state: member.state || '',
                country: member.country || '',
                postalCode: member.postalCode || '',
                servicePreferences: member.servicePreferences || []
            });
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load member data');
            setLoading(false);
        }
    };

    const servicePreferencesOptions = [
        { value: 'children', label: t('Children') },
        { value: 'women', label: t('Women') },
        { value: 'youth', label: t('Youth') },
        { value: 'worship', label: t('Worship') },
        { value: 'integration', label: t('Integration') }
    ];

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


        if (isEditing && !cleanedValues.password) {
            delete cleanedValues.password;
        }

        try {
            if (isEditing) {
                await axios.patch(`/api/members/${username}`, cleanedValues);
                setSuccess('Member updated successfully');
            } else {
                await axios.post('/api/members', cleanedValues);
                setSuccess('Member enrolled successfully');
            }
            setTimeout(() => {
                navigate('/members');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to save member');
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

                    {loading ? (
                        <div className="text-gray-600 p-4">Loading...</div>
                    ) : (
                        <div className="p-4 border-t border-gray-300">
                            <h2 className="text-2xl mb-4 text-gray-700">
                                {isEditing ? `Edit Member: ${username}` : 'Enroll New Member'}
                            </h2>
                            <Formik
                                initialValues={memberData || initialValues}
                                validationSchema={getMemberFormValidationSchema(isEditing)}
                                onSubmit={handleSubmit}
                                enableReinitialize={true}
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
                                                    disabled={isEditing}
                                                    className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
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
                                                <label htmlFor="password" className="block font-medium mb-1">
                                                    Password {isEditing && <span className="text-gray-500">(leave empty to keep current)</span>}
                                                    <ErrorMessage name="password" component="span" className="text-red-500 ml-4" />
                                                </label>
                                                <Field
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    placeholder={isEditing ? "(optional)" : "Password"}
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
                                            {isSubmitting ? (isEditing ? 'Updating...' : 'Enrolling...') : (isEditing ? 'Update Member' : 'Enroll Member')}
                                        </button>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MemberForm;
