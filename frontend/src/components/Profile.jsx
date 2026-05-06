import { useEffect, useState } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import axios from "axios";
import MaskedInput from "react-text-mask";

// Função para remover máscaras
const removeMask = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
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

const ProfileSchema = Yup.object().shape({
    fullname: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    gender: Yup.string().required("Gender is required"),
    dateOfBirth: Yup.date()
        .required("Date of birth is required")
        .min(new Date(1900, 0, 1), "Date of birth must be after 01/01/1900")
        .max(new Date(), "Date of birth must be before today's date"),
    cpf: Yup.string()
        .transform(value => removeMask(value)) // Remove a máscara para validação
        .test('cpf-length', 'CPF must have 11 digits', value => {
            const cleaned = value ? value.replace(/\D/g, '') : '';
            return cleaned.length === 11;
        })
        .required("CPF is required"),
    phone: Yup.string()
        .transform(value => removeMask(value)) // Remove a máscara para validação
        .test('phone-length', 'Phone must have 11 digits', value => {
            const cleaned = value ? value.replace(/\D/g, '') : '';
            return cleaned.length === 11;
        })
        .required("Phone is required"),
    address: Yup.string().required("Address is required"),
    servicePreferences: Yup.array().of(Yup.string()),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    postalCode: Yup.string().required("Postal code is required"),
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

const preferencesOptions = [
    { value: 'children', label: 'Children' },
    { value: 'women', label: 'Women' },
    { value: 'youth', label: 'Youth' },
    { value: 'worship', label: 'Worship' },
    { value: 'welcome', label: 'Welcome' }
];

const Profile = () => {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/api/users/profile')
            .then(response => {
                // Aplica as máscaras nos dados recebidos do backend
                const formattedData = {
                    ...response.data,
                    cpf: applyCpfMask(response.data.cpf),
                    phone: applyPhoneMask(response.data.phone),
                    servicePreferences: Array.isArray(response.data.servicePreferences) ? response.data.servicePreferences : (response.data.servicePreferences ? response.data.servicePreferences.split(',') : [])
                };
                setUserData(formattedData);
            })
            .catch(error => {
                console.error('Failed to fetch user info:', error);
                setError('Failed to fetch user info. Try again.');
            });
    }, []);

    const handleProfile = (values, { setSubmitting }) => {
        setSubmitting(true);
        
        // Remove as máscaras antes de enviar para o backend
        const cleanedValues = {
            ...values,
            cpf: removeMask(values.cpf),
            phone: removeMask(values.phone),
            servicePreferences: values.servicePreferences || []
        };
        
        axios.put('http://localhost:5000/api/users/profile', cleanedValues)
            .then(response => {
                setSuccess(response.data.message);
                setSubmitting(false);
                
                // Atualiza os dados locais com as máscaras aplicadas
                const formattedData = {
                    ...cleanedValues,
                    cpf: applyCpfMask(cleanedValues.cpf),
                    phone: applyPhoneMask(cleanedValues.phone)
                };
                setUserData(formattedData);
            })
            .catch(error => {
                setSubmitting(false);
                console.error('Profile update failed:', error.response?.data?.message);
                setError('Profile update failed. Try again.');
            });
    };

    return (
        <section className="">
            <div className="">
                <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                    <div className="items-center text-gray-600 p-4 flex justify-between">
                        <h1 className="lg:text-3xl md:text-2xl text-xl">
                            Profile
                        </h1>
                        <button 
                            type="button" 
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            <Link to="/change-password">Alterar Senha</Link>
                        </button>
                    </div>
                    
                    {error && <div className="text-red-500 mb-2 px-4">{error}</div>}
                    {success && <div className="text-green-500 mb-2 px-4">{success}</div>}

                    {userData && (
                        <Formik 
                            enableReinitialize 
                            initialValues={{ 
                                fullname: userData?.fullname || '', 
                                email: userData?.email || '', 
                                gender: userData?.gender || '', 
                                dateOfBirth: userData?.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '', 
                                cpf: userData?.cpf || '', 
                                phone: userData?.phone || '', 
                                address: userData?.address || '', 
                                city: userData?.city || '', 
                                state: userData?.state || '', 
                                country: userData?.country || '', 
                                postalCode: userData?.postalCode || '', 
                                servicePreferences: userData?.servicePreferences || [] 
                            }} 
                            onSubmit={handleProfile} 
                            validationSchema={ProfileSchema}
                        >
                            {({ handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue, values }) => (
                                <form onSubmit={handleSubmit} className="p-4">
                                    <div className="mb-4">
                                        <label htmlFor="fullname">Name
                                            <ErrorMessage name="fullname" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="text"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="fullname"
                                                placeholder="Enter your fullname"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="email">Email
                                            <ErrorMessage name="email" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="email"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="email"
                                                placeholder="Enter your email"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block">Gender
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
                                        <label htmlFor="dateOfBirth">Date of Birth
                                            <ErrorMessage name="dateOfBirth" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="date"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="dateOfBirth"                                                
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="cpf">CPF
                                            <ErrorMessage name="cpf" component="span" className="text-red-500 ml-4" />
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
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="phone">Phone
                                            <ErrorMessage name="phone" component="span" className="text-red-500 ml-4" />
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
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="postalCode">Postal Code
                                            <ErrorMessage name="postalCode" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="text"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="postalCode"
                                                placeholder="e.g.: 99999999"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="address">Address
                                            <ErrorMessage name="address" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="text"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="address"
                                                placeholder="Enter your address"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="city">City
                                            <ErrorMessage name="city" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="text"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="city"
                                                placeholder="Enter your city"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="state">State
                                            <ErrorMessage name="state" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="text"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="state"
                                                placeholder="Enter your state"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="country">Country
                                            <ErrorMessage name="country" component="span" className="text-red-500 ml-4" />
                                            <Field
                                                type="text"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                                name="country"
                                                placeholder="Enter your country"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                            />
                                        </label>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block font-medium mb-2">Service preferences</span>
                                        <div className="grid lg:grid-cols-3 gap-2">
                                            {preferencesOptions.map(option => (
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
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                    </button>
                                </form>
                            )}
                        </Formik>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Profile;