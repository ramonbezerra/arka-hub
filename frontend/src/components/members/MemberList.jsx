import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MemberList = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const fetchMembers = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('http://localhost:5000/api/members');
            setMembers(response.data.members || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    return (
        <section className="">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">{t('Members')}</h1>

                    <button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        <Link to="/enroll-member">{t('Enroll Member')}</Link>
                    </button>
                </div>
                {error && <div className="text-red-500 mb-2">{error}</div>}
                {loading && <div className="text-gray-600 mb-2">Loading...</div>}
                {!loading && !members.length && <div className="text-gray-600 mb-2">No members found.</div>}
                {!loading && members.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferences</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {members.map((member) => (
                                    <tr key={member.username} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.fullname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.servicePreferences?.join(', ') || 'None'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <Link
                                                to={`/edit-member/${member.username}`}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

export default MemberList;