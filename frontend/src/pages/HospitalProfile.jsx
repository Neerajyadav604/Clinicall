import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHospitalById, getHospitalDoctors } from "../services/operations/hospitalAdminApi";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const formatTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
};

const HospitalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [hospRes, docRes] = await Promise.all([
          getHospitalById(id),
          getHospitalDoctors(id),
        ]);
        setHospital(hospRes.data);
        setDoctors(docRes.data || []);
      } catch (err) {
        setError(err.message || "Failed to load hospital");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }
  if (error || !hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-red-500">{error || "Hospital not found"}</p>
        <button onClick={() => navigate("/hospitals")} className="text-blue-600 hover:underline">← Back to list</button>
      </div>
    );
  }

  const hasCoords = hospital.location?.latitude && hospital.location?.longitude;
  const lat = hospital.location?.latitude;
  const lng = hospital.location?.longitude;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-52 md:h-72 overflow-hidden bg-gradient-to-r from-blue-700 to-blue-400">
        {hospital.coverImage && (
          <img src={hospital.coverImage} alt="cover" className="w-full h-full object-cover opacity-60" />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 pb-12">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col md:flex-row gap-5 items-start">
          {hospital.logo ? (
            <img src={hospital.logo} alt="logo" className="w-20 h-20 rounded-xl border object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center text-4xl">
              {hospital.isClinic ? "🩺" : "🏥"}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                hospital.isClinic ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}>
                {hospital.isClinic ? "🩺 Clinic" : `🏥 ${hospital.entityType}`}
              </span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                ✅ Verified
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              📍 {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state} — {hospital.address?.pincode}
            </p>
            {hospital.phone && <p className="text-sm text-gray-500 mt-1">📞 {hospital.phone}</p>}
            {hospital.website && (
              <a href={hospital.website} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 block">🌐 {hospital.website}</a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {hospital.about && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{hospital.about}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Type</p>
                  <p className="text-gray-800 font-medium capitalize">{hospital.entityType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Location</p>
                  <p className="text-gray-800 font-medium">{hospital.address?.city}, {hospital.address?.state}</p>
                </div>
                {hospital.establishedYear && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Established</p>
                    <p className="text-gray-800 font-medium">{hospital.establishedYear}</p>
                  </div>
                )}
                {hospital.phone && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Contact</p>
                    <p className="text-gray-800 font-medium">{hospital.phone}</p>
                  </div>
                )}
                {!hospital.isClinic && hospital.totalBeds && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Total Beds</p>
                    <p className="text-gray-800 font-medium">{hospital.totalBeds}</p>
                  </div>
                )}
                {hospital.isClinic && hospital.consultationFee && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Consultation Fee</p>
                    <p className="text-gray-800 font-medium">₹{hospital.consultationFee}</p>
                  </div>
                )}
                {hospital.isClinic && hospital.appointmentDuration && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Appointment Duration</p>
                    <p className="text-gray-800 font-medium">{hospital.appointmentDuration} min</p>
                  </div>
                )}
                {hospital.isClinic && hospital.maxPatientsPerDay && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Max Patients / Day</p>
                    <p className="text-gray-800 font-medium">{hospital.maxPatientsPerDay}</p>
                  </div>
                )}
              </div>

              {/* Hospital Specializations */}
              {!hospital.isClinic && (hospital.specializations || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {hospital.specializations.map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinic Specialization */}
              {hospital.isClinic && (hospital.specializations || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Specialization</p>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                    {hospital.specializations[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Clinic Timings */}
            {hospital.isClinic && hospital.clinicTimings && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Clinic Timings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Day</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Hours</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day) => {
                        const t = hospital.clinicTimings[day];
                        const closed = t?.isClosed;
                        return (
                          <tr key={day} className="border-b border-gray-100">
                            <td className="py-2 capitalize text-gray-800 font-medium">{day}</td>
                            <td className="py-2 text-gray-600">
                              {closed ? "—" : `${formatTime(t?.open)} – ${formatTime(t?.close)}`}
                            </td>
                            <td className="py-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                closed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                              }`}>
                                {closed ? "Closed" : "Open"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
              {hasCoords ? (
                <div>
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 mb-3">
                    <iframe
                      title="map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    🗺 Get Directions
                  </a>
                </div>
              ) : hospital.googleMapsUrl ? (
                <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
                  <iframe
                    title="map"
                    src={hospital.googleMapsUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Location not available</p>
              )}
            </div>

            {/* Doctors */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Our Doctors <span className="text-sm font-normal text-gray-400">({doctors.length})</span>
              </h2>
              {doctors.length === 0 ? (
                <p className="text-gray-400 text-sm">No doctors listed yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doc) => (
                    <div key={doc._id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition">
                      {doc.displayPicture ? (
                        <img src={doc.displayPicture} alt={doc.fullName} className="w-12 h-12 rounded-full object-cover border" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">👨‍⚕️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">Dr. {doc.fullName}</p>
                        <p className="text-xs text-gray-500">{doc.specialization}</p>
                        {doc.experienceYears && <p className="text-xs text-gray-400">{doc.experienceYears} yrs exp.</p>}
                      </div>
                      <button
                        onClick={() => navigate(`/search`)}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Book →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Person */}
            {hospital.contactPerson?.name && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Contact Person</h2>
                <p className="font-medium text-gray-800">{hospital.contactPerson.name}</p>
                {hospital.contactPerson.designation && (
                  <p className="text-sm text-gray-500">{hospital.contactPerson.designation}</p>
                )}
                {hospital.contactPerson.phone && (
                  <p className="text-sm text-gray-600 mt-1">📞 {hospital.contactPerson.phone}</p>
                )}
                {hospital.contactPerson.email && (
                  <p className="text-sm text-gray-600 mt-1">✉️ {hospital.contactPerson.email}</p>
                )}
              </div>
            )}

            {/* Quick stats */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Info</h2>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-500">Doctors</span>
                  <span className="font-semibold text-gray-800">{doctors.length}</span>
                </p>
                {hospital.establishedYear && (
                  <p className="flex justify-between">
                    <span className="text-gray-500">Est.</span>
                    <span className="font-semibold text-gray-800">{hospital.establishedYear}</span>
                  </p>
                )}
                {!hospital.isClinic && hospital.totalBeds && (
                  <p className="flex justify-between">
                    <span className="text-gray-500">Beds</span>
                    <span className="font-semibold text-gray-800">{hospital.totalBeds}</span>
                  </p>
                )}
                {hospital.isClinic && hospital.consultationFee && (
                  <p className="flex justify-between">
                    <span className="text-gray-500">Consultation</span>
                    <span className="font-semibold text-gray-800">₹{hospital.consultationFee}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfile;
