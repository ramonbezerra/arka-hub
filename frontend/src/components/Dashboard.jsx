import { useState, useEffect, useContext } from "react";
import { useAuth } from "../provider/authProvider";
import axios from "axios";

const Dashboard = () => {
    const { token, setToken } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setUserData(null);
            setLoading(false);
            setError("No authentication token found");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        axios.get("http://localhost:5000/api/users/profile")
            .then(res => {
                setUserData(res.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to load user data:', error);
                setError("Failed to load data.");
                setLoading(false);
            });
    }, [token]);

    return (
        <div>
            <h2>Dashboard</h2>
            <p style={{color: error ? 'red' : 'black'}}>{userData?.username || error || 'Loading...'}</p>
        </div>
    );
};

export default Dashboard;