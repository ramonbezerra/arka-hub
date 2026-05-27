import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/client';

const MinistryList = () => {
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [creating, setCreating] = useState(false);
    const [newMinistry, setNewMinistry] = useState({
        name: '',
        description: '',
    });

    const loadMinistries = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/ministries/');
            setMinistries(response.data.ministries || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load ministries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMinistries();
    }, []);

    const handleCreateMinistry = async (e) => {
        e.preventDefault();
        if (!newMinistry.name.trim()) {
            setError('Ministry name is required');
            return;
        }

        try {
            setCreating(true);
            setError('');
            setSuccess('');
            await axios.post('/api/ministries/', {
                name: newMinistry.name.trim(),
                description: newMinistry.description.trim(),
            });
            setNewMinistry({ name: '', description: '' });
            setSuccess('Ministry created successfully');
            await loadMinistries();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create ministry');
        } finally {
            setCreating(false);
        }
    };

    return (
        <section className="space-y-3">
            <h2>Ministries</h2>
            <form onSubmit={handleCreateMinistry} className="border rounded p-3 space-y-2">
                <h3>Create ministry</h3>
                <div>
                    <label htmlFor="ministryName">Name</label>
                    <input
                        id="ministryName"
                        value={newMinistry.name}
                        onChange={(e) =>
                            setNewMinistry((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Ex: Louvor"
                    />
                </div>
                <div>
                    <label htmlFor="ministryDescription">Description</label>
                    <input
                        id="ministryDescription"
                        value={newMinistry.description}
                        onChange={(e) =>
                            setNewMinistry((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        placeholder="Optional description"
                    />
                </div>
                <button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create ministry'}
                </button>
            </form>

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}

            {!loading && !error && ministries.length === 0 && <p>No ministries found.</p>}

            {!loading && !error && ministries.length > 0 && (
                <ul className="space-y-2">
                    {ministries.map((m) => (
                        <li key={m.id} className="border rounded p-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">{m.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {m.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                                <div className="space-x-2">
                                    <Link to={`/ministries/${m.id}/members`}>
                                        Manage members
                                    </Link>
                                    <Link to={`/ministries/${m.id}/schedules`}>
                                        Schedules
                                    </Link>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default MinistryList;
