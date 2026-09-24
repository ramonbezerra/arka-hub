import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../provider/authProvider';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
    const { token, setToken } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        navigate('/'); // Redirect to home after logout
    };

    return (
        <nav className='items-center bg-green-700 text-gray-100 p-4 mb-4 flex space-x-4'>
            <ul className='flex flex-400 space-x-4'>
                <li className='text-2xl text-center'><Link to={token != null ? "/dashboard" : "/"}>Arka Hub</Link></li>
                {token != null && jwtDecode(token).role === 'admin' && (
                    <>
                        <button><Link to="/administrators">{t('Administrators')}</Link></button>
                        <button><Link to="/members">{t('Members')}</Link></button>
                        <button><Link to="/ministries">{t('Ministries')}</Link></button>
                    </>
                )}
                {token != null && (
                    <>
                        <button><Link to="/ministry-schedules">{t('My Ministries')}</Link></button>
                        <button><Link to="/my-schedules">{t('My Schedules')}</Link></button>
                    </>
                )}
            </ul>
            <div className='flex-grow'>
                {token != null ? (
                    <div className='flex space-x-4'>
                        <button><Link to="/profile">{t('Profile')}</Link></button>
                        <button type="button" onClick={handleLogout}>{t('Logout')}</button>
                    </div>
                ) : (
                    <button><Link to="/login">{t('Login')}</Link></button>
                )}
            </div>
        </nav>
    );
}

export default Navbar;