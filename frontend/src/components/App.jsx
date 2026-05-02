import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from '../provider/authProvider';

import ProtectedRoute from '../routes/ProtectedRoute';

import Home from './Home';
import Navbar from './Navbar';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import AdmList from './AdmList';
import PasswordChange from './PasswordChange';

const App = () => {
    return (
        <div className='container-fluid'>
            <AuthProvider>
                <BrowserRouter>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin-list" element={<AdmList />} />
                            <Route path="/change-password" element={<PasswordChange />} />
                        </Route>
                        <Route path="*" element={<div>NotFound</div>} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </div>
    );
}

export default App;