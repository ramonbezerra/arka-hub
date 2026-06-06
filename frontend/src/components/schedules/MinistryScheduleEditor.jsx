import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/client';
import { datetimeLocalToIso } from '../../utils/scheduleApi';
import { Field, Formik } from 'formik';
import { Icon } from '@iconify/react';

const initialSlotForm = {
    title: '',
    roleLabel: '',
    startsAt: '',
    endsAt: '',
    location: '',
    notes: '',
};

const MinistryScheduleEditor = () => {
    const { ministryId, scheduleId } = useParams();
    const [schedule, setSchedule] = useState({});
    const [members, setMembers] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showSlotFormModal, setShowSlotFormModal] = useState(false);
    const [assignmentUsername, setAssignmentUsername] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [showAssignVolunteerModal, setShowAssignVolunteerModal] = useState(false);

    const loadSelectedSchedule = async (id) => {
        if (!id) {
            setSelectedSchedule(null);
            return;
        }
        const response = await axios.get(`/api/schedules/${id}?include_slots=true`);
        setSelectedSchedule(response.data.schedule);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setError('');
                const response = await axios.get(`/api/ministries/${ministryId}/members`);
                setMembers(response.data.members || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load schedule data');
            }
        };

        loadInitialData();
    }, [ministryId]);

    useEffect(() => {
        const load = async () => {
            try {
                setError('');
                await loadSelectedSchedule(scheduleId);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load schedule');
            }
        };
        load();
    }, [scheduleId]);

    const handleCreateSlot = async ( values, { setSubmitting }) => {
        if (!scheduleId) return;
        setSubmitting(true);
        try {
            setError('');
            const payload = {
                ...values,
                startsAt: datetimeLocalToIso(values.startsAt),
                endsAt: datetimeLocalToIso(values.endsAt),
            };
            await axios.post(`/api/schedules/${scheduleId}/slots`, payload);
            setStatusMessage('Slot added');
            setShowSlotFormModal(false);
            await loadSelectedSchedule(scheduleId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add slot');
        }
        setSubmitting(false);
    };

    const handleAssignVolunteer = async (values, { setSubmitting }) => {
        if (!selectedSlotId || !values.assignmentUsername) return;
        setSubmitting(true);
        try {
            setError('');
            await axios.post(`/api/schedules/slots/${selectedSlotId}/assignments`, {
                username: values.assignmentUsername,
            });
            setStatusMessage('Volunteer assigned');
            setShowAssignVolunteerModal(false);
            setSelectedSlotId(null);
            await loadSelectedSchedule(scheduleId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign volunteer');
        }
        setSubmitting(false);
    };

    const handleSelectSlot = (id) => {
        setSelectedSlotId(id);
        setShowAssignVolunteerModal(true);
    };

    return (
        <section className="space-y-4">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1 className="lg:text-3xl md:text-2xl text-xl">Slots for Schedule {selectedSchedule?.title || ''}</h1>
                    <button
                        type="button"
                        onClick={() => setShowSlotFormModal(true)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Add Slot
                    </button>
                </div>
                {statusMessage && <p className="text-green-600">{statusMessage}</p>}
                {error && <p className="text-red-600 mb-2">{error}</p>}
                
                {selectedSchedule?.slots?.length ? (
                    <div className="mb-4 overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigners</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {selectedSchedule.slots.map((slot) => (
                                    <tr key={slot.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {slot.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {slot.roleLabel}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ul>
                                                {(slot.assignments || []).map((assignment) => (
                                                    <li key={assignment.id}>
                                                        <span className="font-medium">{assignment.username}</span>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' : assignment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {assignment.status}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button type="button" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5" onClick={() => handleSelectSlot(slot.id)}>
                                                <Icon icon="tabler:user-plus" width={16} height={16} />
                                                <span className="text-xs">Assign volunteer</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-gray-600 mb-2">No slots yet.</div>
                )}

                {showSlotFormModal &&
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
                            <Formik initialValues={initialSlotForm} onSubmit={handleCreateSlot}>
                                {({ handleChange, handleBlur, handleSubmit, isSubmitting, values }) => (
                                    <form onSubmit={handleSubmit} className="w-full space-y-2">
                                        <h3 className="text-lg font-bold mb-2">Add slot</h3>
                                        {error && <p className="text-red-600 mb-2">{error}</p>}
                                        <Field
                                            aria-label="Slot title"
                                            type="text"
                                            className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            placeholder="Slot title"
                                            value={values.title}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            name="title"
                                        />
                                        <input
                                            aria-label="Role label"
                                            className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            placeholder="Role label"
                                            value={values.roleLabel}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            name="roleLabel"
                                        />
                                        <Field
                                            aria-label="Slot starts at"
                                            type="datetime-local"
                                            className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            value={values.startsAt}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            name="startsAt"
                                        />
                                        <Field
                                            aria-label="Slot ends at"
                                            type="datetime-local"
                                            className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                            value={values.endsAt}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            name="endsAt"
                                        />
                                        <div className="flex gap-4">
                                            <button type="button" onClick={() => setShowSlotFormModal(false)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">Cancel</button>
                                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">Add slot</button>
                                        </div>
                                    </form>
                                )}
                            </Formik>
                        </div>
                    </div>
                }
            </div>

            {showAssignVolunteerModal &&
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
                        <Formik initialValues={{ assignmentUsername: '' }} onSubmit={handleAssignVolunteer}>
                            {({ handleChange, handleBlur, handleSubmit, isSubmitting, values }) => (
                                <form onSubmit={handleSubmit}>
                                    <h3 className="text-lg font-bold mb-2">Assign volunteer</h3>
                                    {error && <p className="text-red-600 mb-2">{error}</p>}
                                    <select disabled={isSubmitting}
                                        aria-label="Volunteer select"
                                        value={values.assignmentUsername}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        name="assignmentUsername"
                                        className="form-control block w-full px-4 py-2 mt-1 mb-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                                    >
                                        <option value="">Select volunteer</option>
                                        {members.map((member) => (
                                            <option key={member.userId} value={member.username}>
                                                {member.fullName || member.username}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setShowAssignVolunteerModal(false)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">Assign volunteer</button>
                                    </div>
                                </form>
                            )}
                        </Formik>
                    </div>
                </div>
            }
        </section>
    );
};

export default MinistryScheduleEditor;
