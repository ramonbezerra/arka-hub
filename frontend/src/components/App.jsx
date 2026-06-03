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
import MemberList from './members/MemberList';
import MemberForm from './members/MemberForm';
import PasswordChange from './PasswordChange';
import MinistrySchedulesHub from './schedules/MinistrySchedulesHub';
import MinistryScheduleEditor from './schedules/MinistryScheduleEditor';
import MySchedules from './schedules/MySchedules';
import MinistryList from './ministries/MinistryList';
import MinistryMembersEditor from './ministries/MinistryMembersEditor';
import MinistryScheduleList from './schedules/MinistryScheduleList';

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
                            <Route path="/administrators" element={<AdmList />} />
                            <Route path="/members" element={<MemberList />} />
                            <Route path="/enroll-member" element={<MemberForm />} />
                            <Route path="/edit-member/:username" element={<MemberForm />} />
                            <Route path="/change-password" element={<PasswordChange />} />
                            <Route path="/ministry-schedules" element={<MinistrySchedulesHub />} />
                            <Route
                                path="/ministries/:ministryId/schedules/:scheduleId"
                                element={<MinistryScheduleEditor />}
                            />
                            <Route
                                path="/ministries/:ministryId/schedules"
                                element={<MinistryScheduleList />}
                            />
                            <Route path="/my-schedules" element={<MySchedules />} />
                            <Route path="/ministries" element={<MinistryList />} />
                            <Route
                                path="/ministries/:ministryId/members"
                                element={<MinistryMembersEditor />}
                            />
                        </Route>
                        <Route path="*" element={<div>NotFound</div>} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </div>
    );
}

export default App;