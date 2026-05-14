import { useState, useEffect } from "react";
import { useAuth } from "../provider/authProvider";
import { useTranslation } from "react-i18next";
import axios from "axios";

const Dashboard = () => {
    const { token, setToken } = useAuth();
    const { t } = useTranslation();
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
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">{t("Dashboard")}</h2>
                <p style={{color: error ? 'red' : 'black'}}>{userData?.username || error || t("Loading...")}</p>
            </div>
        </div>
    );
};

export default Dashboard;