import { useEffect, useState } from 'react';
import axios from '../../api/client';

const MySchedules = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAssignments = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get('/api/schedules/assignments/me');
            setItems(response.data.assignments || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    const updateStatus = async (assignmentId, status) => {
        try {
            setError('');
            await axios.patch(`/api/schedules/assignments/${assignmentId}`, { status });
            await loadAssignments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update assignment');
        }
    };

    return (
        <section>
            <h2>My schedules</h2>
            {loading && <p>Loading assignments...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && items.length === 0 && (
                <p>You do not have assignments yet.</p>
            )}
            {!loading && items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item.assignment.id} className="border rounded p-2">
                            <p>
                                <strong>{item.schedule.title}</strong> - {item.slot.title}
                            </p>
                            <p>Status: {item.assignment.status}</p>
                            {item.assignment.status === 'assigned' && (
                                <div className="space-x-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateStatus(item.assignment.id, 'confirmed')
                                        }
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateStatus(item.assignment.id, 'declined')
                                        }
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default MySchedules;
