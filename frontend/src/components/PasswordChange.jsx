import axios from 'axios'
import * as Yup from 'yup'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../provider/authProvider'
import { ErrorMessage, Field, Formik } from 'formik'

const PasswordSchema = Yup.object().shape({
    old_password: Yup.string().min(4, 'Password must be at least 4 characters').max(120, 'Password must not exceed 120 characters').required('Old password is required'),
    new_password: Yup.string().matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, 'Password must contain at least one big letter, one small letter, one special character and one number').min(8, 'New password must be at least 8 characters').max(120, 'New password must not exceed 120 characters').required('New password is required'),
    repeat_password: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').min(8, 'Confirmation password must be at least 8 characters').max(120, 'Confirmation password must not exceed 120 characters').required('Confirmation password is required'),
});

const PasswordChange = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const { token, setToken } = useAuth();
    const navigate = useNavigate();

    const handlePasswordChange = ({ old_password, new_password, repeat_password }, { setSubmitting }) => {
        setSubmitting({ isValidating: true });
        if (new_password !== repeat_password) {
            setSubmitting({ isValidating: false });
            setError('Passwords do not match');
            return;
        }
        axios.patch('http://localhost:5000/api/auth/change-password', { old_password, new_password })
            .then(response => {
                setToken(response.data.access_token);
                setSubmitting({ isValidating: false });
                navigate('/profile');
            })
            .catch(error => {
                setSubmitting({ isValidating: false });
                console.error('Password change failed:', error);
                setError(error.response.data.message);
            });
    }

    return <section className="">
        <div className="">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">Change Password</h1>
                </div>
                {error && <div className="text-red-500 mb-2">{error}</div>}
                {token && <Formik validationSchema={PasswordSchema} onSubmit={handlePasswordChange} initialValues={{ old_password: '', new_password: '', repeat_password: '' }}>
                    {({ handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='mb-4'>
                                <label htmlFor="password">Current Password
                                    <ErrorMessage name="old_password" component="span" className="text-red-500 ml-4" />
                                    <Field
                                        type="password" 
                                        id="old_password" 
                                        name="old_password" 
                                        onChange={handleChange} 
                                        onBlur={handleBlur} 
                                        className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" />
                                </label>
                            </div>
                            <div className='mb-4'>
                                <label htmlFor="password">New Password
                                    <ErrorMessage name="new_password" component="span" className="text-red-500 ml-4" />
                                    <Field type="password" id="new_password" name="new_password" onChange={handleChange} onBlur={handleBlur} 
                                        className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" />
                                </label>
                            </div>
                            <div className='mb-4'>
                                <label htmlFor="password">Confirm New Password
                                    <ErrorMessage name="repeat_password" component="span" className="text-red-500 ml-4" />
                                    <Field type="password" id="repeat_password" name="repeat_password" onChange={handleChange} onBlur={handleBlur} 
                                    className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" />                                    
                                </label>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Change Password</button>
                        </form>
                    )}
                </Formik>}
            </div>
        </div>
    </section >
}

export default PasswordChange