import { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MemberList = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState(null);
    const { t } = useTranslation();

    const handleDeleteMember = (username) => {
        axios.patch(`http://localhost:5000/api/users/${username}`)
            .then(response => {
                setSuccess(response.data.message);
                setTimeout(() => setSuccess(null), 3000);
                fetchMembers();
            })
            .catch(error => {
                console.error('Failed to delete user:', error);
                setError('Failed to delete user. Try again.');
                setTimeout(() => setError(''), 3000);
            });
    }

    const fetchMembers = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get('http://localhost:5000/api/members', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    show_inactive: showInactive
                }
            });
            setMembers(response.data.members || []);
            setPagination(response.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [currentPage, perPage, showInactive]);

    return (
        <section className="">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">{t('Members')}</h1>

                    <button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <Link to="/enroll-member">{t('Enroll Member')}</Link>
                    </button>
                </div>
                <div className="mb-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(!showInactive)}
                            className="form-checkbox"
                        />
                        <span>{t('Show Inactive Members')}</span>
                    </label>
                </div>
                {success && <div className="text-green-500 mb-2">{success}</div>}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.isActive ? 'Active' : 'Inactive'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <Link
                                                to={`/edit-member/${member.username}`}
                                                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                                title="Edit member"
                                            >
                                                <Icon icon="tabler:edit-filled" width={16} height={16} />
                                                <span className="text-xs">Edit</span>
                                            </Link>
                                            {member.isActive && (
                                                <button
                                                    onClick={() => handleDeleteMember(member.username)}
                                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-2"
                                                    title="Delete member"
                                                >
                                                    <Icon icon="lucide:unplug" width={16} height={16} />
                                                    <span className="text-xs">{t('Unjoin')}</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && members.length > 0 && pagination && (
                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="perPage" className="text-sm font-medium text-gray-700">
                                {t('Items per page')}:
                            </label>
                            <select
                                id="perPage"
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>

                        <div className="text-sm text-gray-600">
                            {t('Showing')} {(currentPage - 1) * perPage + 1} {t('to')} {Math.min(currentPage * perPage, pagination.total)} {t('of')} {pagination.total} {t('members')}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={!pagination.has_prev}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                {'<<'}
                            </button>
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!pagination.has_prev}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                {'<'}
                            </button>

                            <div className="flex items-center gap-1">
                                <span className="text-sm">Page</span>
                                <input
                                    type="number"
                                    value={currentPage}
                                    onChange={(e) => {
                                        const page = parseInt(e.target.value) || 1;
                                        if (page >= 1 && page <= pagination.pages) {
                                            setCurrentPage(page);
                                        }
                                    }}
                                    className="w-12 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                                />
                                <span className="text-sm">of {pagination.pages}</span>
                            </div>

                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!pagination.has_next}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                {'>'}
                            </button>
                            <button
                                onClick={() => setCurrentPage(pagination.pages)}
                                disabled={!pagination.has_next}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                {'>>'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default MemberList;