import { useAuth } from '../provider/authProvider';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Formik, ErrorMessage, Field } from 'formik';
import axios from '../api/client';
import { LoginSchema } from '../utils/validationSchemas';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const { setToken, setRefreshToken } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    const handleLogin = ({ username, password }, { setSubmitting }) => {
        setSubmitting({ isValidating: true });
        axios.post('/api/auth/login', { username, password })
            .then(response => {
                setToken(response.data.access_token);
                setRefreshToken(response.data.refresh_token);
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
                        <h1 className="lg:text-3xl md:text-2xl text-xl">{t('Login')}</h1>
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
                                    <label htmlFor="username">{t('Username')}
                                        <ErrorMessage name="username" component="span" className="text-red-500 ml-4" />
                                        <Field
                                            type="text"
                                            name="username"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder={t('Enter your username')}
                                            className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                        />
                                    </label>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password">{t('Password')}
                                        <ErrorMessage name="password" component="span" className="text-red-500 ml-4" />
                                        <Field
                                            type="password"
                                            name="password"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder={t('Enter your password')}
                                            className="form-control block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                        />
                                    </label>
                                </div>
                                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="submit" disabled={isSubmitting}>{t('Login')}</button>
                            </form>
                        )}
                    </Formik>
                    <p className='mt-4'>{t("Don't have an account?")} <a href="/register" className='text-blue-500 hover:text-blue-700'>{t('Register')} {t('here')}</a>.</p>
                </div>
            </div>
        </section>
    );
}

export default Login;
