import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../../api/client";
import { Icon } from "@iconify/react";
import { Field, Formik } from "formik";

const MinistryList = () => {
  const { t } = useTranslation();
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [newMinistry, setNewMinistry] = useState({
    name: "",
    description: "",
  });

  const loadMinistries = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/ministries/");
      setMinistries(response.data.ministries || []);
    } catch (err) {
      setError(err.response?.data?.message || t("Failed to load ministries"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMinistries();
  }, []);

  const handleCreateMinistry = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await axios.post("/api/ministries/", {
        name: values.name.trim(),
        description: values.description.trim(),
      });
      setSuccess(t("Ministry created successfully"));
      await loadMinistries();
      setShowMinistryModal(false);
    } catch (err) {
      setError(err.response?.data?.message || t("Failed to create ministry"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="lg:w-[88%] sm:w-[88%] w-full mx-auto shadow-2xl p-4 rounded-xl h-fit self-center bg-gray-100">
        <div className="items-center text-gray-600 p-4 flex justify-between">
          <h1 className="lg:text-3xl md:text-2xl text-xl">{t("Ministries")}</h1>
          <button
            type="button"
            onClick={() => setShowMinistryModal(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            {t("Add Ministry")}
          </button>
        </div>

        {showMinistryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 flex flex-col items-center">
              <Formik initialValues={{ name: "", description: "", }} onSubmit={handleCreateMinistry}>
                {({ handleChange, handleBlur, handleSubmit, isSubmitting, values }) => (
                  <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-bold mb-2">{t("Create ministry")}</h3>
                    <div>
                      <label htmlFor="name">{t("Name")}</label>
                      <Field
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={t("Ex: Louvor")}
                        required
                        className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                      />
                    </div>
                    <div className="mt-2">
                      <label htmlFor="description">{t("Description")}</label>
                      <Field
                        type="text"
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={t("Optional description")}
                        className="form-control block w-full px-4 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                      />
                    </div>

                    <div className="flex gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowMinistryModal(false)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        {t("Create ministry")}
                      </button>
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          </div>
        )}

        {loading && <p>{t("Loading...")}</p>}
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        {!loading && !error && ministries.length === 0 && (
          <p>{t("No ministries found.")}</p>
        )}

        {!loading && !error && ministries.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("Name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ministries.map((ministry) => (
                  <tr key={ministry.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ministry.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ministry.isActive ? t("Active") : t("Inactive")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Link to={`/ministries/${ministry.id}/members`}>
                        <button
                          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                          type="button"
                        >
                          <Icon
                            icon="fluent:people-team-16-filled"
                            width={16}
                            height={16}
                          />
                          <span className="text-xs">{t("Manage members")}</span>
                        </button>
                      </Link>
                      <Link to={`/ministries/${ministry.id}/schedules`}>
                        <button
                          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                          type="button"
                        >
                          <Icon icon="tabler:calendar" width={16} height={16} />
                          <span className="text-xs">{t("Schedules")}</span>
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default MinistryList;
