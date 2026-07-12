import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../../api/client";
import { Icon } from "@iconify/react";
import { Field, Formik } from "formik";

const MinistryMembersEditor = () => {
  const { t } = useTranslation();
  const { ministryId } = useParams();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showMemberModal, setShowMemberModal] = useState(false);

  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);

  const canSearch = useMemo(() => (search || "").trim().length >= 2, [search]);

  const loadMemberships = async () => {
    const response = await axios.get(`/api/ministries/${ministryId}/members`);
    setMemberships(response.data.members || []);
  };

  const searchMembers = async () => {
    if (!canSearch) {
      setCandidates([]);
      return;
    }
    const response = await axios.get("/api/members", {
      params: { search },
    });
    setCandidates(response.data.members || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");
        await loadMemberships();
      } catch (err) {
        setError(
          err.response?.data?.message || t("Failed to load ministry members"),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ministryId]);

  useEffect(() => {
    const run = async () => {
      try {
        setError("");
        await searchMembers();
      } catch (err) {
        setError(err.response?.data?.message || t("Failed to search members"));
      }
    };
    run();
  }, [search]);

  const handleAdd = async (values, { setSubmitting }) => {
    try {
      setError("");
      setSubmitting(true);
      setSuccess("");
      await axios.post(`/api/ministries/${ministryId}/members`, {
        username: values.selectedUsername,
        role: values.selectedRole,
      });
      await loadMemberships();
      setSuccess(t("Member added to ministry"));
      setShowMemberModal(false);
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || t("Failed to add member"));
    }
  };

  const handleRemove = async (userId) => {
    try {
      setError("");
      setSuccess("");
      await axios.delete(`/api/ministries/${ministryId}/members/${userId}`);
      await loadMemberships();
      setSuccess(t("Member removed from ministry"));
    } catch (err) {
      setError(err.response?.data?.message || t("Failed to remove member"));
    }
  };

  return (
    <section className="space-y-4">
      <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
        <div className="items-center text-gray-600 p-4 flex justify-between">
          <h1 className="lg:text-3xl md:text-2xl text-xl">
            {t("Manage ministry members")}
          </h1>
          <button
            type="button"
            onClick={() => setShowMemberModal(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            {t("Add Member")}
          </button>
        </div>

        {loading && <p>{t("Loading...")}</p>}
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
              <Formik initialValues={{ selectedRole: '', selectedUsername: '' }} onSubmit={handleAdd}>
                {({ handleChange, handleBlur, handleSubmit, isSubmitting, values }) => (
                <form onSubmit={handleSubmit} className="w-full space-y-2">
                  <h3 className="text-lg font-bold mb-2">
                    {t("Add member")}
                  </h3>
                  {error && <p className="text-red-600 mb-2">{error}</p>}

                  <Field
                    aria-label={t("Search members")}
                    type="text"
                    className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    placeholder={t("Type at least 2 characters")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    name="memberSearch"
                    onBlur={handleBlur}
                  />

                  <Field
                    aria-label={t("Select member")}
                    as="select"
                    className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    value={values.selectedUsername}
                    onChange={handleChange}
                    name="selectedUsername"
                    onBlur={handleBlur}
                  >
                    <option value="">{t("Select")}</option>
                    {candidates.map((m) => (
                      <option key={m.username} value={m.username}>
                        {(m.fullname || m.username) + ` (${m.username})`}
                      </option>
                    ))}
                  </Field>

                  <Field
                    aria-label={t("Role")}
                    as="select"
                    className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    value={values.selectedRole}
                    onChange={handleChange}
                    name="selectedRole"
                    onBlur={handleBlur}
                  >
                    <option value="">{t("Select an option")}</option>
                    <option value="volunteer">{t("Volunteer")}</option>
                    <option value="leader">{t("Leader")}</option>
                  </Field>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(false)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {t("Add to ministry")}
                    </button>
                  </div>
                </form>
              )}
            </Formik>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!loading && memberships.length === 0 && (
            <p>{t("No members yet.")}</p>
          )}
          {memberships.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("Name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("Role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memberships.map((member) => (
                    <tr key={member.userId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.role === "leader"
                          ? t("Leader")
                          : t("Volunteer")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                          onClick={() => handleRemove(member.userId)}
                        >
                          <Icon icon="tabler:trash" width={16} height={16} />
                          <span className="text-xs">{t("Remove")}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MinistryMembersEditor;
