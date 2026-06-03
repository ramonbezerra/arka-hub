import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/client';
import { Icon } from '@iconify/react';

const MinistrySchedulesHub = () => {
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadMinistries = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/ministries/me');
                setMinistries(response.data.ministries || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load ministries');
            } finally {
                setLoading(false);
            }
        };

        loadMinistries();
    }, []);

    return (
        <section>
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">Ministry schedules</h1>
                </div>
                {loading && <div className="text-gray-600 mb-2">Loading ministries...</div>}
                {error && <div className="text-red-500 mb-2">{error}</div>}
                {!loading && !error && ministries.length === 0 && (
                    <div className="text-gray-600 mb-2">You are not assigned to any ministry.</div>
                )}
                {!loading && !error && ministries.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ministry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ministries.map((ministry) => (
                                    <tr key={ministry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/ministries/${ministry.id}/schedules`}>
                                                {ministry.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/ministries/${ministry.id}/schedules`}>
                                                <button type="button" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                                    <Icon icon="tabler:calendar-stats" width={16} height={16} />
                                                    <span>View Schedules</span>
                                                </button>
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
};

export default MinistrySchedulesHub;
