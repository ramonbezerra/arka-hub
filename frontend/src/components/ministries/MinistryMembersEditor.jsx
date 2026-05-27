import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/client';

const MinistryMembersEditor = () => {
    const { ministryId } = useParams();
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [selectedUsername, setSelectedUsername] = useState('');
    const [selectedRole, setSelectedRole] = useState('volunteer');

    const canSearch = useMemo(() => (search || '').trim().length >= 2, [search]);

    const loadMemberships = async () => {
        const response = await axios.get(`/api/ministries/${ministryId}/members`);
        setMemberships(response.data.members || []);
    };

    const searchMembers = async () => {
        if (!canSearch) {
            setCandidates([]);
            return;
        }
        const response = await axios.get('/api/members', {
            params: { search },
        });
        setCandidates(response.data.members || []);
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                setSuccess('');
                await loadMemberships();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load ministry members');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [ministryId]);

    useEffect(() => {
        const run = async () => {
            try {
                setError('');
                await searchMembers();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to search members');
            }
        };
        run();
    }, [search]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedUsername) return;
        try {
            setError('');
            setSuccess('');
            await axios.post(`/api/ministries/${ministryId}/members`, {
                username: selectedUsername,
                role: selectedRole,
            });
            await loadMemberships();
            setSelectedUsername('');
            setSelectedRole('volunteer');
            setSuccess('Member added to ministry');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemove = async (userId) => {
        try {
            setError('');
            setSuccess('');
            await axios.delete(`/api/ministries/${ministryId}/members/${userId}`);
            await loadMemberships();
            setSuccess('Member removed from ministry');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove member');
        }
    };

    return (
        <section className="space-y-4">
            <h2>Manage ministry members</h2>

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}

            <form onSubmit={handleAdd} className="space-y-2 border rounded p-3">
                <h3>Add member</h3>

                <div className="space-y-1">
                    <label htmlFor="memberSearch">Search members</label>
                    <input
                        id="memberSearch"
                        value={search}
                        placeholder="Type at least 2 characters"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="memberSelect">Select member</label>
                    <select
                        id="memberSelect"
                        value={selectedUsername}
                        onChange={(e) => setSelectedUsername(e.target.value)}
                    >
                        <option value="">Select</option>
                        {candidates.map((m) => (
                            <option key={m.username} value={m.username}>
                                {(m.fullname || m.username) + ` (${m.username})`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor="roleSelect">Role</label>
                    <select
                        id="roleSelect"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        <option value="volunteer">Volunteer</option>
                        <option value="leader">Leader</option>
                    </select>
                </div>

                <button type="submit" disabled={!selectedUsername}>
                    Add to ministry
                </button>
            </form>

            <div className="space-y-2">
                <h3>Current members</h3>
                {!loading && memberships.length === 0 && <p>No members yet.</p>}
                {memberships.length > 0 && (
                    <ul className="space-y-2">
                        {memberships.map((m) => (
                            <li key={m.userId} className="border rounded p-2 flex justify-between">
                                <div>
                                    <div className="font-medium">{m.fullName || m.username}</div>
                                    <div className="text-sm text-gray-600">
                                        {m.username} — {m.role}
                                    </div>
                                </div>
                                <button type="button" onClick={() => handleRemove(m.userId)}>
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default MinistryMembersEditor;
