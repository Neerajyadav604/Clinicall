import React, { useState } from "react";
import { searchDoctors, requestAppointment } from "../services/operations/SearchApi";

const mapStatus = (s) => {
  if (!s) return "Book Appointment";
  const normal = s.toLowerCase();
  if (normal.includes("request") && normal.includes("sent")) return "Pending Approval";
  if (normal.includes("pending")) return "Pending Approval";
  if (normal.includes("accepted") || normal.includes("approve")) return "Request Accepted";
  if (normal.includes("reject") || normal.includes("again")) return "Request Again";
  if (normal.includes("book") || normal === "request appointment") return "Book Appointment";
  return s;
};

export default function DoctorSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [showBook, setShowBook] = useState(null); // doctorId for which booking modal is open
  const [bookingData, setBookingData] = useState({ appointmentDate: "", appointmentTime: "", reason: "" });

  const token = localStorage.getItem("token");

  const handleSearch = async () => {
    setError(null);
    setDoctors([]);
    if (!query.trim()) {
      setError("Please enter a search term");
      return;
    }
    setLoading(true);
    try {
      const data = await searchDoctors(query, token);
      // If server responded with HTML, be defensive
      if (!data || typeof data !== "object") {
        console.error("Unexpected response format", data);
        setError("Unexpected server response");
        setLoading(false);
        return;
      }

      if (data.success && Array.isArray(data.doctors) && data.doctors.length > 0) {
        setDoctors(data.doctors);
      } else if (data.success && Array.isArray(data.doctors) && data.doctors.length === 0) {
        setError("No doctors found");
      } else {
        setError(data.message || "No doctors found");
      }
    } catch (errResp) {
      // errResp may be axios response
      if (errResp && errResp.status === 401) {
        setError("Unauthorized — please login to search doctors.");
      } else if (errResp && errResp.data && typeof errResp.data === "string" && errResp.data.includes("<html")) {
        console.error("Server returned HTML for searchDoctors:", errResp.data);
        setError("Server error: received HTML response");
      } else {
        console.error(errResp);
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openBooking = (doctorId) => {
    setShowBook(doctorId);
    setBookingData({ appointmentDate: "", appointmentTime: "", reason: "" });
  };

  const submitBooking = async (doctorId) => {
    setError(null);
    if (!bookingData.appointmentDate || !bookingData.appointmentTime || !bookingData.reason) {
      setError("Please fill date, time and reason for appointment.");
      return;
    }
    try {
      await requestAppointment(doctorId, bookingData, token);
      // update local doctor status to Pending Approval
      setDoctors((prev) => prev.map(d => d._id === doctorId ? { ...d, buttonStatus: 'Pending Approval' } : d));
      setShowBook(null);
    } catch (errResp) {
      if (errResp && errResp.status === 401) setError("Unauthorized — please login to request appointment.");
      else setError(errResp?.data?.message || "Could not send appointment request.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-24 p-4">
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctors, symptoms or specialties" className="flex-1 px-4 py-2 border rounded" />
        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {/* Empty state before search */}
      {doctors.length === 0 && !loading && !error && query.trim() === "" && (
        <div className="mt-6 p-8 rounded-lg border border-dashed border-gray-200 text-center bg-white">
          <h3 className="text-xl font-semibold text-gray-900">Find the right doctor</h3>
          <p className="mt-2 text-sm text-gray-500">Search by symptoms, specialty or doctor type — try one of these examples:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['heart doctor', 'skin specialist', 'pediatrician', 'dentist', 'ENT'].map((t) => (
              <button key={t} onClick={() => setQuery(t)} className="px-3 py-1.5 bg-gray-100 text-sm rounded-full hover:bg-gray-200">{t}</button>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">No results will appear until you search.</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {doctors.map((doc) => (
          <div key={doc._id} className="border rounded p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {doc.image ? (
                <img src={doc.image} alt={doc.fullName || 'doctor'} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {((doc.fullName || 'U').split(' ').map(n => n[0]).slice(0, 2).join(''))}
                </div>
              )}

              <div>
                <div className="text-lg font-semibold">{doc.fullName}</div>
                <div className="text-sm text-gray-600">{doc.specialization} • {doc.experienceYears ?? 'N/A'} yrs</div>
              </div>
            </div>

            <div>
              {(() => {
                const status = mapStatus(doc.buttonStatus);
                if (status === 'Book Appointment') {
                  return <button onClick={() => openBooking(doc._id)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded">Book Appointment</button>
                }
                return <button disabled className="px-4 py-2 bg-gray-200 text-gray-700 rounded">{status}</button>
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBook && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Request Appointment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600">Date</label>
                <input type="date" value={bookingData.appointmentDate} onChange={(e) => setBookingData(p => ({ ...p, appointmentDate: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Time</label>
                <input type="time" value={bookingData.appointmentTime} onChange={(e) => setBookingData(p => ({ ...p, appointmentTime: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Reason</label>
                <textarea value={bookingData.reason} onChange={(e) => setBookingData(p => ({ ...p, reason: e.target.value }))} className="mt-1 w-full px-3 py-2 border rounded" rows={3} />
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowBook(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => submitBooking(showBook)} className="px-4 py-2 bg-blue-600 text-white rounded">Send Request</button>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
