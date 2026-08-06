import axios from "../api/client";
import { useState, useEffect } from "react";
import { useAuth } from "../provider/authProvider";
import { jwtDecode } from "jwt-decode";

const AdmList = () => {
    const { token } = useAuth();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [fetched, setFetched] = useState(false);
    const [admins, setAdmins] = useState([]);

    useEffect(() => {
        if (!fetched) {
            fetchAdminList(setAdmins, setFetched, setError);
        }
    }, [fetched])

    const fetchAdminList = (setAdmins, setFetched, setError) => {
        axios.get('/api/users/admin')
            .then(response => {
                setAdmins(response.data.admins);
                setFetched(true);
            })
            .catch(error => {
                console.error('Failed to fetch user info:', error);
                setError('Failed to fetch user info. Try again.');
            });
    }

    const handleEnableOrDisable = (username) => {
        axios.patch(`/api/users/${username}`)
            .then(response => {
                setSuccess(response.data.message);
                fetchAdminList(setAdmins, setFetched, setError);
            })
            .catch(error => {
                console.error('Failed to delete user:', error);
                setError('Failed to delete user. Try again.');
            });
    }

    return (
        <section className="">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-4 flex justify-between">
                    <h1
                        className="lg:text-3xl md:text-2xl text-xl">
                        Administrators
                    </h1>
                </div>
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <div className="mb-4">
                    {admins && admins.length > 0 && <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Username
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.map((element, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{element.fullname}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{element.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{element.username}</div>
                                    </td>
                                    <td>
                                        {jwtDecode(token).sub === element.username &&
                                            <div className="text-sm text-gray-900">No actions available</div>
                                        }
                                        {jwtDecode(token).sub !== element.username && !element.isActive && <button
                                            onClick={() => handleEnableOrDisable(element.username)}
                                            className="bg-green-500 mr-2 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                            Enable
                                        </button>}
                                        {jwtDecode(token).sub !== element.username && element.isActive && <button
                                            onClick={() => handleEnableOrDisable(element.username)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                            Disable
                                        </button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>}
                </div>
            </div>
        </section>
    );
}

export default AdmList


