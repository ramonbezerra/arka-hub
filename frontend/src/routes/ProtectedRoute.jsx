import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../provider/authProvider';

const ProtectedRoute = () => {
    const { token } = useAuth();

    return token != null ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;