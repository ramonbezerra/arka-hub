import { useEffect, useState } from 'react';
import axios from '../../api/client';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

const MySchedules = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [showConfirmDeclineModal, setShowConfirmDeclineModal] = useState(false);
    const { t } = useTranslation();

    const loadAssignments = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get('/api/schedules/assignments/me');
            setItems(response.data.assignments || []);
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to load assignments'));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDecline = async (assignmentId, status, showModal) => {
        try {
            setError('');
            setShowConfirmDeclineModal(showModal);
            setSelectedAssignmentId(assignmentId);
            setSelectedStatus(status);
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to confirm or decline assignment'));
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    const updateStatus = async () => {
        try {
            console.log(selectedStatus)
            setError('');
            await axios.patch(`/api/schedules/assignments/${selectedAssignmentId}`, { status: selectedStatus });
            setSelectedAssignmentId(null);
            setSelectedStatus(null);
            await loadAssignments();
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to update assignment'));
        }
        setShowConfirmDeclineModal(false);
    };

    return (
        <section>
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">{t('My Schedules')}</h1>
                </div>
                {loading && <div className="text-gray-600 mb-2">{t('Loading assignments...')}</div>}
                {error && <div className="text-red-500 mb-2">{error}</div>}
                {!loading && !error && items.length === 0 && (
                    <div className="text-gray-600 mb-2">{t('You do not have assignments yet.')}</div>
                )}
                {!loading && !error && items.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Schedule')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Slot')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item) => (
                                    <tr key={item?.assignment?.id || item?.slot?.id || item?.schedule?.id || Math.random()}>
                                        <td className="px-6 py-4 whitespace-nowrap">{item?.schedule?.title || t('Unknown schedule')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item?.slot?.title || t('Unknown slot')}</td>
                                        {item?.assignment?.status === 'assigned' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                    {t('Assigned')}
                                                </span>
                                            </td>
                                        )}
                                        {item?.assignment?.status === 'confirmed' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                    {t('Confirmed')}
                                                </span>
                                            </td>
                                        )}
                                        {item?.assignment?.status === 'declined' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                    {t('Declined')}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item?.assignment?.status === 'assigned' && (
                                                <div className="space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConfirmDecline(item.assignment.id, 'confirmed', true)}
                                                        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-2"
                                                    >
                                                        <Icon icon="tabler:check-filled" width={16} height={16} />
                                                        <span className="text-xs">{t('Confirm')}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConfirmDecline(item.assignment.id, 'declined', true)}
                                                        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-2"
                                                    >
                                                        <Icon icon="tabler:x-filled" width={16} height={16} />
                                                        <span className="text-xs">{t('Decline')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showConfirmDeclineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
                        <h3 className="text-lg font-bold mb-2">{selectedStatus === 'confirmed' ? t('Confirm') : t('Decline')} {t('Assignment')}</h3>
                        <span className="mb-4 text-center text-gray-600">
                            {selectedStatus === 'confirmed'
                                ? t('Are you sure you want to confirm this assignment?')
                                : t('Are you sure you want to decline this assignment?')}
                        </span>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => handleConfirmDecline(null, null, false)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">{t('Cancel')}</button>
                            <button type="submit" onClick={() => updateStatus()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">{t('Confirm')}</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default MySchedules;