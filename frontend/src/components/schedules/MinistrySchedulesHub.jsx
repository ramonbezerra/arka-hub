import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/client';

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
            <h2>Ministry schedules</h2>
            {loading && <p>Loading ministries...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && ministries.length === 0 && (
                <p>You are not assigned to any ministry.</p>
            )}
            {!loading && ministries.length > 0 && (
                <ul className="space-y-2">
                    {ministries.map((ministry) => (
                        <li key={ministry.id}>
                            <Link to={`/ministries/${ministry.id}/schedules`}>
                                {ministry.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default MinistrySchedulesHub;
