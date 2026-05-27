import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/client';
import { datetimeLocalToIso } from '../../utils/scheduleApi';

const initialScheduleForm = {
    title: '',
    startDate: '',
    endDate: '',
};

const initialSlotForm = {
    title: '',
    roleLabel: '',
    startsAt: '',
    endsAt: '',
    location: '',
    notes: '',
};

const MinistryScheduleEditor = () => {
    const { ministryId } = useParams();
    const [schedules, setSchedules] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);
    const [slotForm, setSlotForm] = useState(initialSlotForm);
    const [assignmentUsername, setAssignmentUsername] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    const selectedSlotId = useMemo(
        () => selectedSchedule?.slots?.[0]?.id || null,
        [selectedSchedule]
    );

    const loadSchedules = async () => {
        const response = await axios.get(`/api/ministries/${ministryId}/schedules`);
        const items = response.data.schedules || [];
        setSchedules(items);
        if (!selectedScheduleId && items.length > 0) {
            setSelectedScheduleId(items[0].id);
        }
    };

    const loadMembers = async () => {
        const response = await axios.get(`/api/ministries/${ministryId}/members`);
        setMembers(response.data.members || []);
    };

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
                await Promise.all([loadSchedules(), loadMembers()]);
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
                await loadSelectedSchedule(selectedScheduleId);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load schedule');
            }
        };
        load();
    }, [selectedScheduleId]);

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const response = await axios.post(
                `/api/ministries/${ministryId}/schedules`,
                scheduleForm
            );
            setStatusMessage('Schedule created');
            setScheduleForm(initialScheduleForm);
            await loadSchedules();
            setSelectedScheduleId(response.data.schedule.id);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create schedule');
        }
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        if (!selectedScheduleId) return;
        try {
            setError('');
            const payload = {
                ...slotForm,
                startsAt: datetimeLocalToIso(slotForm.startsAt),
                endsAt: datetimeLocalToIso(slotForm.endsAt),
            };
            await axios.post(`/api/schedules/${selectedScheduleId}/slots`, payload);
            setStatusMessage('Slot added');
            setSlotForm(initialSlotForm);
            await loadSelectedSchedule(selectedScheduleId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add slot');
        }
    };

    const handleAssignVolunteer = async (e) => {
        e.preventDefault();
        if (!selectedSlotId || !assignmentUsername) return;
        try {
            setError('');
            await axios.post(`/api/schedules/slots/${selectedSlotId}/assignments`, {
                username: assignmentUsername,
            });
            setStatusMessage('Volunteer assigned');
            setAssignmentUsername('');
            await loadSelectedSchedule(selectedScheduleId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign volunteer');
        }
    };

    const handlePublish = async () => {
        if (!selectedScheduleId) return;
        try {
            setError('');
            await axios.post(`/api/schedules/${selectedScheduleId}/publish`);
            setStatusMessage('Schedule published');
            await loadSchedules();
            await loadSelectedSchedule(selectedScheduleId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to publish schedule');
        }
    };

    return (
        <section className="space-y-4">
            <h2>Ministry schedule editor</h2>
            {statusMessage && <p className="text-green-600">{statusMessage}</p>}
            {error && <p className="text-red-600">{error}</p>}

            <form onSubmit={handleCreateSchedule} className="space-y-2">
                <h3>Create schedule</h3>
                <input
                    aria-label="Schedule title"
                    placeholder="Schedule title"
                    value={scheduleForm.title}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                />
                <input
                    aria-label="Schedule start date"
                    type="date"
                    value={scheduleForm.startDate}
                    onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, startDate: e.target.value })
                    }
                />
                <input
                    aria-label="Schedule end date"
                    type="date"
                    value={scheduleForm.endDate}
                    onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, endDate: e.target.value })
                    }
                />
                <button type="submit">Create schedule</button>
            </form>

            <div>
                <h3>Schedules</h3>
                {schedules.length === 0 ? (
                    <p>No schedules yet.</p>
                ) : (
                    <ul>
                        {schedules.map((schedule) => (
                            <li key={schedule.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedScheduleId(schedule.id)}
                                >
                                    {schedule.title} ({schedule.status})
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedSchedule && (
                <div className="space-y-3">
                    <h3>Selected schedule: {selectedSchedule.title}</h3>
                    <button type="button" onClick={handlePublish}>
                        Publish schedule
                    </button>

                    <form onSubmit={handleCreateSlot} className="space-y-2">
                        <h4>Add slot</h4>
                        <input
                            aria-label="Slot title"
                            placeholder="Slot title"
                            value={slotForm.title}
                            onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                        />
                        <input
                            aria-label="Role label"
                            placeholder="Role label"
                            value={slotForm.roleLabel}
                            onChange={(e) =>
                                setSlotForm({ ...slotForm, roleLabel: e.target.value })
                            }
                        />
                        <input
                            aria-label="Slot starts at"
                            type="datetime-local"
                            value={slotForm.startsAt}
                            onChange={(e) =>
                                setSlotForm({ ...slotForm, startsAt: e.target.value })
                            }
                        />
                        <input
                            aria-label="Slot ends at"
                            type="datetime-local"
                            value={slotForm.endsAt}
                            onChange={(e) =>
                                setSlotForm({ ...slotForm, endsAt: e.target.value })
                            }
                        />
                        <button type="submit">Add slot</button>
                    </form>

                    <div>
                        <h4>Slots</h4>
                        {selectedSchedule.slots?.length ? (
                            <ul>
                                {selectedSchedule.slots.map((slot) => (
                                    <li key={slot.id}>
                                        {slot.title} - {slot.roleLabel || 'General'}
                                        <ul>
                                            {(slot.assignments || []).map((assignment) => (
                                                <li key={assignment.id}>
                                                    {assignment.username} ({assignment.status})
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No slots yet.</p>
                        )}
                    </div>

                    <form onSubmit={handleAssignVolunteer}>
                        <h4>Assign volunteer to first slot</h4>
                        <select
                            aria-label="Volunteer select"
                            value={assignmentUsername}
                            onChange={(e) => setAssignmentUsername(e.target.value)}
                        >
                            <option value="">Select volunteer</option>
                            {members.map((member) => (
                                <option key={member.userId} value={member.username}>
                                    {member.fullName || member.username}
                                </option>
                            ))}
                        </select>
                        <button type="submit" disabled={!selectedSlotId}>
                            Assign volunteer
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
};

export default MinistryScheduleEditor;
