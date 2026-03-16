import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllHospitals } from "../services/operations/hospitalAdminApi";

const SPECIALIZATIONS = [
  "Any", "Cardiology", "Neurology", "Orthopedics", "Gynecology", "Pediatrics",
  "Oncology", "Dermatology", "Ophthalmology", "ENT", "General Surgery",
  "Psychiatry", "Urology", "Nephrology", "Gastroenterology", "Pulmonology",
];

const EntityTypeBadge = ({ entityType, isClinic }) => {
  const colors = {
    clinic:         "bg-green-100 text-green-700",
    government:     "bg-blue-100 text-blue-700",
    private:        "bg-purple-100 text-purple-700",
    trust:          "bg-yellow-100 text-yellow-700",
    multispecialty: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[entityType] || "bg-gray-100 text-gray-600"}`}>
      {isClinic ? "🩺 Clinic" : `🏥 ${entityType?.charAt(0).toUpperCase()}${entityType?.slice(1)}`}
    </span>
  );
};

const HospitalList = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeTab, setActiveTab]           = useState("all"); // "all" | "hospital" | "clinic"
  const [search, setSearch]                 = useState("");
  const [specFilter, setSpecFilter]         = useState("Any");

  useEffect(() => {
    fetchHospitals();
  }, [activeTab]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (activeTab === "hospital") filters.isClinic = false;
      if (activeTab === "clinic")   filters.isClinic = true;
      const res = await getAllHospitals(filters);
      setHospitals(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  const filtered = hospitals.filter((h) => {
    const matchesSearch =
      !search ||
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchesSpec =
      specFilter === "Any" ||
      (h.specializations || []).includes(specFilter);
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hospitals &amp; Clinics</h1>
            <p className="text-gray-500 mt-1">Find verified healthcare facilities near you</p>
          </div>
          <button
            onClick={() => navigate("/hospital-registration")}
            className="shrink-0 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow"
          >
            + Register Your Hospital / Clinic
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all",      label: "All"         },
            { key: "hospital", label: "🏥 Hospitals" },
            { key: "clinic",   label: "🩺 Clinics"   },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 md:w-52"
          >
            {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No results found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h) => (
              <div key={h._id} className="bg-white rounded-2xl shadow hover:shadow-lg transition p-5 flex flex-col">
                {/* Logo / Cover */}
                <div className="flex items-center gap-3 mb-4">
                  {h.logo ? (
                    <img src={h.logo} alt={h.name} className="w-14 h-14 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                      {h.isClinic ? "🩺" : "🏥"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{h.name}</p>
                    <EntityTypeBadge entityType={h.entityType} isClinic={h.isClinic} />
                  </div>
                </div>

                {/* Location */}
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                  📍 {h.address?.city}, {h.address?.state}
                </p>

                {/* Specializations */}
                {(h.specializations || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.specializations.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                    {h.specializations.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        +{h.specializations.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {h.isClinic && h.consultationFee ? (
                    <p>💰 ₹{h.consultationFee} consultation</p>
                  ) : h.totalBeds ? (
                    <p>🛏 {h.totalBeds} beds</p>
                  ) : null}
                  <p>👨‍⚕️ {h.doctorsCount || 0} doctor{h.doctorsCount !== 1 ? "s" : ""}</p>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/hospitals/${h._id}`)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalList;
