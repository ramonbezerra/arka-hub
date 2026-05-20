import { useState, useEffect } from 'react';
import axios from '../../api/client';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MultiSelect from './MultiSelect';
import { EMPTY_FILTERS, hasActiveFilters } from '../../utils/memberFilters';

const MemberList = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [sortColumn, setSortColumn] = useState('username');
    const [sortDirection, setSortDirection] = useState('asc');
    const { t } = useTranslation();

    const handleDeleteMember = (username) => {
        axios.patch(`/api/users/${username}`)
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

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedMembers = [...members].sort((a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        if (sortColumn === 'servicePreferences') {
            aValue = aValue ? aValue.join(', ') : '';
            bValue = bValue ? bValue.join(', ') : '';
        } else if (sortColumn === 'isActive') {
            aValue = aValue ? 'Active' : 'Inactive';
            bValue = bValue ? 'Active' : 'Inactive';
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const fetchMembers = async () => {
        setLoading(true);
        setError('');

        try {
            const params = {
                page: currentPage,
                per_page: perPage,
                show_inactive: showInactive,
                search: '',
                fullname: filters.fullname,
                email: filters.email,
                phone: filters.phone,
                cpf: filters.cpf,
                dateOfBirth: filters.dateOfBirth
            };

            // Handle multi-select filters by converting arrays to comma-separated strings
            if (filters.gender.length > 0) params.gender = filters.gender.join(',');
            if (filters.servicePreferences.length > 0) params.servicePreferences = filters.servicePreferences.join(',');
            if (filters.status.length > 0) params.status = filters.status.join(',');

            const response = await axios.get('/api/members', {
                params
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
    }, [currentPage, perPage, showInactive, filters]);

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
                <div className="mb-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                        >
                            <Icon icon={showAdvancedFilters ? "mdi:chevron-up" : "mdi:chevron-down"} />
                            {showAdvancedFilters ? t('Hide Advanced Filters') : t('Show Advanced Filters')}
                        </button>
                        {hasActiveFilters(filters, showInactive) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowInactive(false);
                                    setFilters(EMPTY_FILTERS);
                                    setCurrentPage(1);
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                {t('Clear Filters')}
                            </button>
                        )}
                    </div>
                    {showAdvancedFilters && (
                        <div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Name')}</label>
                                        <input
                                            type="text"
                                            value={filters.fullname}
                                            onChange={(e) => setFilters({ ...filters, fullname: e.target.value })}
                                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Email')}</label>
                                        <input
                                            type="text"
                                            value={filters.email}
                                            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Phone')}</label>
                                        <input
                                            type="text"
                                            value={filters.phone}
                                            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('CPF')}</label>
                                        <input
                                            type="text"
                                            value={filters.cpf}
                                            onChange={(e) => setFilters({ ...filters, cpf: e.target.value })}
                                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Date of Birth')}</label>
                                        <input
                                            type="date"
                                            value={filters.dateOfBirth}
                                            onChange={(e) => setFilters({ ...filters, dateOfBirth: e.target.value })}
                                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                    <MultiSelect
                                        label={t('Gender')}
                                        options={[
                                            { value: 'male', label: 'Masculino' },
                                            { value: 'female', label: 'Feminino' },
                                        ]}
                                        values={filters.gender}
                                        onChange={(newValues) => setFilters({ ...filters, gender: newValues })}
                                        placeholder={t('Select genders...')}
                                    />
                                    <MultiSelect
                                        label={t('Preferences')}
                                        options={[
                                            { value: 'children', label: t('Children') },
                                            { value: 'women', label: t('Women') },
                                            { value: 'youth', label: t('Youth') },
                                            { value: 'worship', label: t('Worship') },
                                            { value: 'integration', label: t('Integration') }
                                        ]}
                                        values={filters.servicePreferences}
                                        onChange={(newValues) => setFilters({ ...filters, servicePreferences: newValues })}
                                        placeholder={t('Select preferences...')}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                        className="form-checkbox"
                                    />
                                    <label className="text-sm text-gray-700 mb-0">{t('Show Inactive Members')}</label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {success && <div className="text-green-500 mb-2">{success}</div>}
                {error && <div className="text-red-500 mb-2">{error}</div>}
                {loading && <div className="text-gray-600 mb-2">Loading...</div>}
                {!loading && !members.length && <div className="text-gray-600 mb-2">No members found.</div>}
                {!loading && members.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('username')}>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span>Username</span>
                                            {sortColumn === 'username' && (sortDirection === 'asc' ? <Icon icon="mdi:sort-ascending" /> : <Icon icon="mdi:sort-descending" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('fullname')}>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span>Name</span>
                                            {sortColumn === 'fullname' && (sortDirection === 'asc' ? <Icon icon="mdi:sort-ascending" /> : <Icon icon="mdi:sort-descending" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span>Email</span>
                                            {sortColumn === 'email' && (sortDirection === 'asc' ? <Icon icon="mdi:sort-ascending" /> : <Icon icon="mdi:sort-descending" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('phone')}>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span>Phone</span>
                                            {sortColumn === 'phone' && (sortDirection === 'asc' ? <Icon icon="mdi:sort-ascending" /> : <Icon icon="mdi:sort-descending" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('servicePreferences')}>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span>Preferences</span>
                                            {sortColumn === 'servicePreferences' && (sortDirection === 'asc' ? <Icon icon="mdi:sort-ascending" /> : <Icon icon="mdi:sort-descending" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-24" onClick={() => handleSort('isActive')}>
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            <span>Status</span>
                                            {sortColumn === 'isActive' && (sortDirection === 'asc' ? <Icon icon="mdi:sort-ascending" /> : <Icon icon="mdi:sort-descending" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedMembers.map((member) => (
                                    <tr key={member.username} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.fullname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.servicePreferences?.join(', ') || 'None'}</td>
                                        <td className="px-6 py-4 w-24 max-w-[6rem] whitespace-nowrap overflow-hidden text-ellipsis text-sm text-gray-900">{member.isActive ? 'Active' : 'Inactive'}</td>
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