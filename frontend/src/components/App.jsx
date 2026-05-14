import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import AuthProvider, { useAuth } from '../provider/authProvider';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

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

const AppContent = () => {
    const { token } = useAuth();
    const { t } = useTranslation();
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState("");
    const [agentLoading, setAgentLoading] = useState(false);
    const [agentResult, setAgentResult] = useState(null);
    const [agentError, setAgentError] = useState(null);

    const handleAgentSubmit = async (e) => {
        e.preventDefault();
        
        if (!agentPrompt.trim()) {
            setAgentError(t("Please enter a prompt"));
            return;
        }

        setAgentLoading(true);
        setAgentError(null);
        setAgentResult(null);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/agent/enroll",
                { prompt: agentPrompt },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );
            setAgentResult(response.data);
            setAgentPrompt("");
        } catch (err) {
            console.error('Agent request failed:', err);
            setAgentError(err.response?.data?.message || err.message || t("Failed to process agent request"));
        } finally {
            setAgentLoading(false);
        }
    };

    const closeAgentModal = () => {
        setIsAgentModalOpen(false);
        setAgentResult(null);
        setAgentError(null);
        setAgentPrompt("");
    };

    return (
        <>
            <Navbar />
            
            {/* Floating Agent Icon */}
            <div 
                className="fixed top-20 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg cursor-pointer z-50 transition-colors duration-200"
                onClick={() => setIsAgentModalOpen(true)}
                title={t("Member Enrollment Agent")}
            >
                🤖
            </div>

            {/* Agent Modal */}
            {isAgentModalOpen && (
                <div className="fixed top-20 right-16 bg-white rounded-lg p-6 shadow-xl border border-gray-200 z-50 max-w-sm w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{t("Member Enrollment Agent")}</h3>
                        <button 
                            onClick={closeAgentModal}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm">
                        {t("Test the member enrollment agent. Enter a prompt with member details in the format:")}
                        <br/>
                        <code className="bg-gray-100 px-2 py-1 text-xs">username: joao_silva, email: joao@example.com, password: senha123, fullname: João Silva, phone: 11987654321, cpf: 12345678901, gender: male, preferências: children,worship</code>
                    </p>
                    
                    <form onSubmit={handleAgentSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="agentPrompt" className="block font-medium mb-2">
                                {t("Enrollment Prompt")}
                            </label>
                            <textarea
                                id="agentPrompt"
                                value={agentPrompt}
                                onChange={(e) => setAgentPrompt(e.target.value)}
                                placeholder={t("Enter member details...")}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                disabled={agentLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={agentLoading}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {agentLoading ? t("Processing...") : t("Test Enrollment Agent")}
                        </button>
                    </form>

                    {agentError && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            <p className="font-bold">{t("Error")}:</p>
                            <p>{agentError}</p>
                        </div>
                    )}

                    {agentResult && (
                        <div className={`mt-4 p-4 rounded border ${
                            agentResult.success 
                                ? 'bg-green-100 border-green-400 text-green-700' 
                                : 'bg-yellow-100 border-yellow-400 text-yellow-700'
                        }`}>
                            <p className="font-bold">
                                {agentResult.success ? t("Success") : t("Validation Errors")}: {agentResult.message}
                            </p>
                            
                            {agentResult.errors && Object.keys(agentResult.errors).length > 0 && (
                                <div className="mt-3 text-sm">
                                    <p className="font-semibold mb-2">{t("Validation Errors")}:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {Object.entries(agentResult.errors).map(([field, error]) => (
                                            <li key={field}>
                                                <strong>{field}:</strong> {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {agentResult.extracted && Object.keys(agentResult.extracted).length > 0 && (
                                <div className="mt-3 text-sm">
                                    <p className="font-semibold mb-2">{t("Extracted Data")}:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {Object.entries(agentResult.extracted).map(([key, value]) => (
                                            <li key={key}>
                                                <strong>{key}:</strong> {JSON.stringify(value)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

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
                </Route>
                <Route path="*" element={<div>NotFound</div>} />
            </Routes>
        </>
    );
};

const App = () => {
    return (
        <div className='container-fluid'>
            <AuthProvider>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </AuthProvider>
        </div>
    );
}

export default App;