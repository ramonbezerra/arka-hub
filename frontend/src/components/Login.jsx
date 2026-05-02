import { useAuth } from '../provider/authProvider';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Formik, ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const LoginSchema = Yup.object().shape({
    username: Yup.string()
        .required('Username is required'),
    password: Yup.string().min(4, 'Password must be at least 4 characters').max(120, 'Password must not exceed 120 characters')
        .required('Password is required')
});

const Login = () => {
    const { setToken } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleLogin = ({ username, password }, { setSubmitting }) => {
        setSubmitting({ isValidating: true });
        axios.post('http://localhost:5000/api/auth/login', { username, password })
            .then(response => {
                setToken(response.data.access_token);
                setSubmitting({ isValidating: false });
                navigate('/dashboard');
            })
            .catch(error => {
                setSubmitting({ isValidating: false });
                if (error.code === 'ERR_NETWORK') setError('Network error');
                else setError(error.response.data.message);
            });
    }

    return (
        <section className="">
            <div className="">
                <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                    <div className="items-center text-gray-600 p-4 flex justify-between">
                        <h1 className="lg:text-3xl md:text-2xl text-xl">Login</h1>
                    </div>
                    {error && <div className="text-red-500 mb-2">{error}</div>}

                    <Formik
                        enableReinitialize
                        initialValues={{ username: '', password: '' }}
                        validationSchema={LoginSchema}
                        onSubmit={handleLogin}>
                        {({ handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="username">Username
                                        <ErrorMessage name="username" component="span" className="text-red-500 ml-4" />
                                        <Field
                                            type="text"
                                            name="username"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Enter your username"
                                            className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                        />
                                    </label>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password">Password
                                        <ErrorMessage name="password" component="span" className="text-red-500 ml-4" />
                                        <Field
                                            type="password"
                                            name="password"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Enter your password"
                                            className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                        />
                                    </label>
                                </div>
                                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="submit" disabled={isSubmitting}>Login</button>
                            </form>
                        )}
                    </Formik>
                    <p className='mt-4'>Don't have an account? <a href="/register" className='text-blue-500 hover:text-blue-700'>Register here</a>.</p>
                </div>
            </div>
        </section>
    );
}

export default Login;
