import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from '../../api/client';
import { datetimeLocalToIso } from '../../utils/scheduleApi';
import { Field, Formik } from 'formik';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

const initialScheduleForm = {
    title: '',
    startDate: '',
    endDate: '',
};

const MinistryScheduleList = () => {
    const { ministryId } = useParams();
    const [error, setError] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);
    const [showScheduleFormModal, setShowScheduleFormModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [ministry, setMinistry] = useState(null);
    const [assignmentUsername, setAssignmentUsername] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const { t } = useTranslation();

    const loadSchedules = async () => {
        const response = await axios.get(`/api/ministries/${ministryId}/schedules`);
        setMinistry(response.data.ministry);
        setSchedules(response.data.schedules || []);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setError('');
                await Promise.all([loadSchedules(), loadMembers()]);
            } catch (err) {
                setError(err.response?.data?.message || t('Failed to load schedule data'));
            }
        };

        loadInitialData();
    }, [ministryId]);

    const handleCreateSchedule = async (values, { setSubmitting }) => {
        try {
            setError('');
            setSubmitting(true);
            const response = await axios.post(
                `/api/ministries/${ministryId}/schedules`,
                values
            );
            setShowScheduleFormModal(false);
            setStatusMessage(t('Schedule created'));
            setScheduleForm(initialScheduleForm);
            await loadSchedules();
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to create schedule'));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublishSchedule = async (scheduleId) => {
        if (!scheduleId) return;
        try {
            setError('');
            setShowPublishModal(true);
            await axios.post(`/api/schedules/${scheduleId}/publish`);
            setStatusMessage(t('Schedule published'));
            await loadSchedules();
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to publish schedule'));
        }
    };

    return (
        <section>
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">{t('Schedules of')} {ministry?.name || ''} {t('Ministry')}</h1>
                    <button
                        type="button"
                        onClick={() => setShowScheduleFormModal(true)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        {t('Create New')}
                    </button>
                </div>
                {schedules.length === 0 ? (
                    <div className="text-gray-600 mb-2">{t('No schedules yet.')}</div>
                ) : (
                    <div className="mb-4 overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Schedule')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {schedules.map((schedule) => (
                                    <tr key={schedule.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {schedule.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${schedule.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : schedule.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {t(schedule.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-x-2">
                                                <Link to={`/ministries/${ministryId}/schedules/${schedule.id}`}>
                                                    <button className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                                        type="button">
                                                        <Icon icon="tabler:edit-filled" width={16} height={16} />
                                                        <span className="text-xs">{t('Edit')}</span>
                                                    </button>
                                                </Link>
                                                {schedule.status === 'draft'
                                                    ? <button className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-2"
                                                            type="button" onClick={() => handlePublishSchedule(schedule.id)}>
                                                            <Icon icon="tabler:share" width={16} height={16} />
                                                            <span className="text-xs">{t('Publish')}</span>
                                                        </button>
                                                    : <button className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-2"
                                                        type="button" onClick={() => handleArchiveSchedule(schedule.id)}>
                                                        <Icon icon="tabler:archive-filled" width={16} height={16} />
                                                        <span className="text-xs">{t('Archive')}</span>
                                                    </button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                {showScheduleFormModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
                            <Formik initialValues={initialScheduleForm} onSubmit={handleCreateSchedule}>
                                {({ handleChange, handleBlur, handleSubmit, isSubmitting, values }) => (
                                    <form onSubmit={handleSubmit} className="w-full space-y-2">
                                        <h3 className="text-lg font-bold mb-2">{t('Create schedule')}</h3>
                                        {error && <p className="text-red-600 mb-2">{error}</p>}
                                        <div className="mb-2">
                                            <label htmlFor="title" className="block font-medium mb-2">{t('Title')}</label>
                                            <Field
                                                type="text"
                                                aria-label="Schedule title"
                                                placeholder={t('Schedule title')}
                                                value={values.title}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                name="title"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label htmlFor="startDate" className="block font-medium mb-2">{t('Start date')}</label>
                                            <Field
                                                type="date"
                                                aria-label="Schedule start date"
                                                value={values.startDate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                name="startDate"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label htmlFor="endDate" className="block font-medium mb-2">{t('End date')}</label>
                                            <Field
                                                type="date"
                                                value={values.endDate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                name="endDate"
                                                className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                                onClick={() => setShowScheduleFormModal(false)}>
                                                {t('Cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? t('Creating...') : t('Create schedule')}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </Formik>
                        </div>
                    </div>
                )}
            </div>

            <div>
                {showPublishModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
                            <Icon icon="mdi:alert" className="text-yellow-500 mb-2" width={34} height={34} />
                            <h3 className="text-lg font-bold mb-2 text-gray-800">{t('Confirm Publish')}</h3>
                            <p className="mb-4 text-center text-gray-600">
                                {t('Are you sure you want to publish this schedule?')}
                                <br />
                                {t('All assignments and slots will be visible to members.')}
                            </p>
                            <div className="flex gap-4">
                                <button
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                                    onClick={async () => {
                                        await handlePublishSchedule(selectedScheduleId);
                                        setShowPublishModal(false);
                                    }}
                                >
                                    {t('Publish')}
                                </button>
                                <button
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg transition"
                                    onClick={() => setShowPublishModal(false)}
                                    type="button"
                                >
                                    {t('Cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default MinistryScheduleList;