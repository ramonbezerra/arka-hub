import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../provider/authProvider";
import axios from "../api/client";
import { useTranslation } from "react-i18next";

const MAX_SCHEDULES_PER_MINISTRY = 3;
const CARDS_PER_VIEW = 2;

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
    const slots = Array.isArray(schedule?.slots) ? schedule.slots.filter(Boolean) : [];
    return slots.reduce((total, slot) => total + ((slot?.assignments || []).length || 0), 0);
};

const getSlotStartTime = (slot) => {
    if (!slot) return null;
    return slot.startsAt || slot.startTime || null;
};

const getNextSlot = (schedule) => {
    const slots = Array.isArray(schedule?.slots)
        ? schedule.slots.filter(Boolean).filter((slot) => !!getSlotStartTime(slot))
        : [];

    slots.sort((a, b) => new Date(getSlotStartTime(a)) - new Date(getSlotStartTime(b)));

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

const getAssignmentStatusSummary = (assignments = []) => {
    return assignments.reduce(
        (summary, item) => {
            const status = item?.assignment?.status || item?.status || "assigned";

            if (status === "confirmed") summary.confirmed += 1;
            else if (status === "declined") summary.declined += 1;
            else summary.pending += 1;

            return summary;
        },
        { pending: 0, confirmed: 0, declined: 0 }
    );
};

const Dashboard = () => {
    const { token } = useAuth();
    const [userData, setUserData] = useState(null);
    const [cards, setCards] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        setCarouselIndex(0);
    }, [cards.length]);

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
                const [ministriesResponse, assignmentsResponse] = await Promise.all([
                    axios.get("/api/ministries/"),
                    axios.get("/api/schedules/assignments/me")
                ]);
                const ministries = ministriesResponse.data.ministries || [];
                setMyAssignments(assignmentsResponse.data.assignments || []);

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

                            const limitedSchedules = detailedSchedules
                                .slice(0, MAX_SCHEDULES_PER_MINISTRY)
                                .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));

                            const primarySchedule = limitedSchedules[0] || null;

                            return {
                                ministry,
                                schedules: limitedSchedules,
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

    const visibleCards = cards.slice(carouselIndex, carouselIndex + CARDS_PER_VIEW);
    const canGoPrev = carouselIndex > 0;
    const canGoNext = carouselIndex + CARDS_PER_VIEW < cards.length;
    const assignmentSummary = getAssignmentStatusSummary(myAssignments);

    return (
        <div className="space-y-4">
            <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
                <div className="items-center text-gray-600 p-6 flex justify-center">
                    <h2 className="lg:text-3xl md:text-2xl text-xl text-center">{userData?.username ? t("Welcome") + ", " + userData?.username : error || "Loading..."}</h2>
                </div>

                {!loading && !error && (
                    <div className="lg:w-[95%] sm:w-[90%] w-full mx-auto mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Communications</p>
                                    <h3 className="text-lg font-semibold text-slate-800">Reminders</h3>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
                                    aria-label="Add reminder"
                                >
                                    <Icon icon="tabler:plus" width={16} height={16} />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Next service</p>
                                    <p className="mt-1 text-sm font-medium text-slate-700">Volunteer check-in on Saturday at 8:00 AM</p>
                                </div>
                                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Announcement</p>
                                    <p className="mt-1 text-sm font-medium text-slate-700">Ministry sync meeting this Friday at 6:30 PM</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Update</p>
                                    <p className="mt-1 text-sm font-medium text-slate-700">Three new slots were added to the worship schedule</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-5">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Next Schedules</p>
                                        <h3 className="text-lg font-semibold text-slate-800">My slots</h3>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
                                        aria-label="Add schedule"
                                    >
                                        <Icon icon="tabler:plus" width={16} height={16} />
                                    </button>
                                </div>
                                <div className="w-full mx-auto grid gap-3 md:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Pending</p>
                                            <Icon icon="tabler:clock-hour-4" className="text-amber-300" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-amber-500">{assignmentSummary.pending}</span>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Confirmed</p>
                                            <Icon icon="tabler:check" className="text-emerald-600" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-emerald-800">{assignmentSummary.confirmed}</span>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Declined</p>
                                            <Icon icon="tabler:x" className="text-rose-600" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-rose-800">{assignmentSummary.declined}</span>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Upcoming</p>
                                            <Icon icon="tabler:calendar-event" className="text-blue-600" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-blue-800">{upcomingCount}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Next Schedules</p>
                                        <h3 className="text-lg font-semibold text-slate-800">My slots</h3>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100"
                                        aria-label="Add schedule"
                                    >
                                        <Icon icon="tabler:plus" width={16} height={16} />
                                    </button>
                                </div>
                                <div className="w-full mx-auto grid gap-3 md:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">My pending slots</p>
                                            <Icon icon="tabler:clock-hour-4" className="text-amber-300" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-amber-500">{assignmentSummary.pending}</span>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Confirmed</p>
                                            <Icon icon="tabler:check" className="text-emerald-600" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-emerald-800">{assignmentSummary.confirmed}</span>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Declined</p>
                                            <Icon icon="tabler:x" className="text-rose-600" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-rose-800">{assignmentSummary.declined}</span>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Upcoming</p>
                                            <Icon icon="tabler:calendar-event" className="text-blue-600" width={22} height={22} />
                                        </div>
                                        <span className="text-3xl font-bold text-blue-800">{upcomingCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && cards.length > 0 && (
                    <div className="lg:w-[95%] sm:w-[90%] w-full mx-auto mt-4 grid gap-4 ">
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Highlights</p>
                                    <h3 className="text-lg font-semibold text-slate-800">Ministry schedules</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Previous ministry"
                                        onClick={() => setCarouselIndex((current) => Math.max(current - 1, 0))}
                                        disabled={!canGoPrev}
                                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Icon icon="tabler:chevron-left" width={18} height={18} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Next ministry"
                                        onClick={() => setCarouselIndex((current) => Math.min(current + 1, Math.max(cards.length - CARDS_PER_VIEW, 0)))}
                                        disabled={!canGoNext}
                                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Icon icon="tabler:chevron-right" width={18} height={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                                {visibleCards.map(({ ministry, schedules, primarySchedule }) => {
                                    const nextSlot = getNextSlot(primarySchedule);
                                    const volunteerCount = getAssignmentCount(primarySchedule);
                                    const recentSchedules = [...(schedules || [])].slice(0, MAX_SCHEDULES_PER_MINISTRY);

                                    return (
                                        <div key={ministry.id} className="min-w-[270px] flex-1 snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-h-[260px]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Ministry</p>
                                                    <h3 className="text-lg font-semibold text-slate-800 leading-tight">{ministry.name}</h3>
                                                </div>
                                                {primarySchedule && (
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                                        {primarySchedule.status}
                                                    </span>
                                                )}
                                            </div>

                                            {primarySchedule && (
                                                <div className="space-y-2 text-sm text-slate-600">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Featured schedule</p>
                                                        <p className="text-base font-medium text-slate-800 leading-snug">{primarySchedule.title}</p>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Icon icon="tabler:calendar" width={14} height={14} />
                                                        <span>{formatDateRange(primarySchedule.startDate, primarySchedule.endDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Icon icon="tabler:clock-hour-4" width={14} height={14} />
                                                        <span>{(primarySchedule.slots || []).length} slots</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Icon icon="tabler:users" width={14} height={14} />
                                                        <span>{volunteerCount} volunteers</span>
                                                    </div>
                                                    {nextSlot && getSlotStartTime(nextSlot) && (
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-700">
                                                            <Icon icon="tabler:star-filled" width={14} height={14} className="text-amber-500" />
                                                            <span>
                                                                Next: {nextSlot.title || "Open slot"} · {new Date(getSlotStartTime(nextSlot)).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {recentSchedules.length > 0 && (
                                                <div className="mt-1 text-left">
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Schedules</p>
                                                    <ul className="space-y-1 text-xs text-slate-700">
                                                        {recentSchedules.map((schedule) => (
                                                            <li key={schedule.id} className="truncate">• {schedule.title}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/ministries/${ministry.id}/schedules`)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                                >
                                                    <Icon icon="tabler:arrow-right" width={14} height={14} />
                                                    <span>View schedule</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && cards.length === 0 && (
                    <div className="lg:w-[95%] sm:w-[90%] w-full mx-auto bg-white rounded-xl shadow-md p-6 text-gray-600 mt-4">
                        No ministry schedules are available for your account right now.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;