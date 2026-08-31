import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../provider/authProvider";
import axios from "../api/client";
import { useTranslation } from "react-i18next";

const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return "No dates";
    const format = (value) => {
        if (!value) return "N/A";
        const parsed = new Date(`${value}T00:00:00`);
        return Number.isNaN(parsed.getTime())
            ? value
            : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    };

    return `${format(startDate)} - ${format(endDate)}`;
};

const getAssignmentCount = (schedule) => {
    const slots = schedule?.slots || [];
    return slots.reduce((total, slot) => total + ((slot.assignments || []).length || 0), 0);
};

const getNextSlot = (schedule) => {
    const slots = [...((schedule?.slots || []).filter(Boolean))].sort(
        (a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0)
    );

    return slots[0] || null;
};

const getSlotCoverage = (schedule) => {
    const slots = schedule?.slots || [];
    const assigned = slots.filter((slot) => (slot.assignments || []).length > 0).length;
    const unassigned = Math.max(slots.length - assigned, 0);
    return { assigned, unassigned };
};

const getTotalSlotCoverage = (cards) => {
    let totalAssigned = 0;
    let totalUnassigned = 0;
    cards.forEach((card) => {
        card.schedules.forEach((schedule) => {
            const coverage = getSlotCoverage(schedule);
            totalAssigned += coverage.assigned;
            totalUnassigned += coverage.unassigned;
        });
    });
    return { totalAssigned, totalUnassigned };
};

const Dashboard = () => {
    const { token } = useAuth();
    const [userData, setUserData] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            if (!token) {
                if (isMounted) {
                    setUserData(null);
                    setCards([]);
                    setLoading(false);
                    setError("No authentication token found");
                }
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const userResponse = await axios.get("/api/users/profile");
                const ministriesResponse = await axios.get("/api/ministries/");
                const ministries = ministriesResponse.data.ministries || [];

                const ministryCards = await Promise.all(
                    ministries.map(async (ministry) => {
                        try {
                            const schedulesResponse = await axios.get(`/api/ministries/${ministry.id}/schedules`);
                            const schedules = schedulesResponse.data.schedules || [];

                            const detailedSchedules = await Promise.all(
                                schedules.map(async (schedule) => {
                                    try {
                                        const detailResponse = await axios.get(`/api/schedules/${schedule.id}?include_slots=true`);
                                        return detailResponse.data.schedule || schedule;
                                    } catch (detailError) {
                                        return schedule;
                                    }
                                })
                            );

                            const sortedSchedules = [...detailedSchedules].sort(
                                (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)
                            );

                            const primarySchedule =
                                sortedSchedules.find((schedule) => schedule.status !== "archived") ||
                                sortedSchedules[0] ||
                                null;

                            return {
                                ministry,
                                schedules: detailedSchedules,
                                primarySchedule,
                            };
                        } catch (scheduleError) {
                            return {
                                ministry,
                                schedules: [],
                                primarySchedule: null,
                            };
                        }
                    })
                );

                const visibleCards = ministryCards.filter((card) => card.schedules.length > 0);

                if (isMounted) {
                    setUserData(userResponse.data);
                    setCards(visibleCards);
                }
            } catch (loadError) {
                console.error("Failed to load dashboard data:", loadError);
                if (isMounted) {
                    setUserData(null);
                    setCards([]);
                    setError("Failed to load data.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();
        return () => {
            isMounted = false;
        };
    }, [token]);

    const upcomingCount = cards.filter((card) => {
        const schedule = card.primarySchedule;
        if (!schedule?.startDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(`${schedule.startDate}T00:00:00`);
        return startDate >= today;
    }).length;

    return (
        <div className="space-y-4">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                {<div className="items-center text-gray-600 p-6 flex justify-center">
                    <h2 className="lg:text-3xl md:text-2xl text-xl text-center">{userData?.username ? t("Welcome") + ", " + userData?.username: error || "Loading..."}</h2>
                </div>}
                {!loading && !error && (() => {
                    const slotCoverage = getTotalSlotCoverage(cards);
                    return (
                        <div className="lg:w-[95%] sm:w-[90%] w-full mx-auto grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-stretch gap-4">
                                <ul className="flex-1 space-y-1 text-sm text-gray-600">
                                    <li className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ministries</li>
                                    {cards.slice(0, 2).map((card) => (
                                        <li key={card.ministry.id} className="truncate text-gray-700 font-medium text-base">{card.ministry.name}</li>
                                    ))}
                                </ul>
                                <div className="flex flex-col items-center justify-center bg-blue-50 rounded-md px-4 py-2 border border-blue-200 min-w-[80px]">
                                    <p className="text-4xl font-bold text-blue-800">{cards.length}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-stretch gap-4">
                                <ul className="flex-1 space-y-1 text-sm text-gray-600">
                                    <li className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Schedules</li>
                                    {cards.flatMap((card) => card.schedules).slice(0, 2).map((schedule) => (
                                        <li key={schedule.id} className="truncate text-gray-700 font-medium text-base">{schedule.title}</li>
                                    ))}
                                </ul>
                                <div className="flex flex-col items-center justify-center bg-purple-50 rounded-md px-4 py-2 border border-purple-200 min-w-[80px]">
                                    <p className="text-4xl font-bold text-purple-800">{cards.reduce((total, card) => total + card.schedules.length, 0)}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Assigned</p>
                                    <p className="text-sm text-gray-600 mt-1">Slots filled</p>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-md px-4 py-2 border border-emerald-200 min-w-[80px]">
                                    <p className="text-4xl font-bold text-emerald-800">{slotCoverage.totalAssigned}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Unassigned</p>
                                    <p className="text-sm text-gray-600 mt-1">Need volunteers</p>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-amber-50 rounded-md px-4 py-2 border border-amber-200 min-w-[80px]">
                                    <p className="text-4xl font-bold text-amber-800">{slotCoverage.totalUnassigned}</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {!loading && !error && cards.length === 0 && (
                    <div className="lg:w-[95%] sm:w-[90%] w-full mx-auto bg-white rounded-xl shadow-md p-6 text-gray-600 mt-3">
                        No ministry schedules are available for your account right now.
                    </div>
                )}

                {!loading && !error && cards.length > 0 && (
                    <div className="lg:w-[95%] sm:w-[90%] w-full mx-auto grid gap-2 md:grid-cols-2 xl:grid-cols-4 mt-3">
                        {cards.map(({ ministry, schedules, primarySchedule }) => {
                            const nextSlot = getNextSlot(primarySchedule);
                            const volunteerCount = getAssignmentCount(primarySchedule);
                            const recentSchedules = [...(schedules || [])].slice(0, 3);

                            return (
                                <div key={ministry.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-3 flex flex-col gap-2 min-h-[260px]">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500">Ministry</p>
                                            <h3 className="text-lg font-semibold text-gray-800 leading-tight">{ministry.name}</h3>
                                        </div>
                                        {primarySchedule && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                                                {primarySchedule.status}
                                            </span>
                                        )}
                                    </div>

                                    {primarySchedule && (
                                        <div className="space-y-1.5 text-sm text-gray-600">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500">Featured schedule</p>
                                                <p className="text-base font-medium text-gray-800 leading-snug">{primarySchedule.title}</p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Icon icon="tabler:calendar" width={14} height={14} />
                                                <span className="text-xs">{formatDateRange(primarySchedule.startDate, primarySchedule.endDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Icon icon="tabler:clock-hour-4" width={14} height={14} />
                                                <span className="text-xs">{(primarySchedule.slots || []).length} slots</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Icon icon="tabler:users" width={14} height={14} />
                                                <span className="text-xs">{volunteerCount} volunteers</span>
                                            </div>
                                            {nextSlot && (
                                                <div className="flex items-center gap-1.5 text-gray-700">
                                                    <Icon icon="tabler:star-filled" width={14} height={14} className="text-amber-500" />
                                                    <span className="text-[11px] leading-snug">
                                                        Next: {nextSlot.title || "Open slot"} · {new Date(nextSlot.startsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-auto flex items-center justify-end">
                                        <Link to={`/ministries/${ministry.id}/schedules`}>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded transition-all duration-200 shadow-sm hover:shadow-md text-xs"
                                            >
                                                <Icon icon="tabler:arrow-right" width={14} height={14} />
                                                <span>View</span>
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;