import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  checkChatAccess,
  initiatePayment,
  setConsultationMode,
  verifyPayment,
} from "../services/operations/consultationApi";
import {
  getRequestsByStatus,
  getUserRequests,
} from "../services/operations/requestApi";

const STATUS_META = {
  APPROVED: {
    label: "Approved",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  PENDING: {
    label: "Pending",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelled",
    chip: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  DEFAULT: {
    label: "Updated",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
};

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState({});
  const [processingConsultation, setProcessingConsultation] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const userPrefill = useMemo(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return { name: "", email: "" };
    try {
      const parsed = JSON.parse(userRaw);
      return {
        name: parsed?.fullName || "",
        email: parsed?.email || "",
      };
    } catch (error) {
      return { name: "", email: "" };
    }
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const [requestsRes, statsRes] = await Promise.all([
          getUserRequests("ALL"),
          getRequestsByStatus(),
        ]);

        if (requestsRes?.success && Array.isArray(requestsRes.data)) {
          setRequests(requestsRes.data);
        }

        if (statsRes?.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (selectedStatus === "ALL") return requests;
    return requests.filter((req) => req.approvalstatus === selectedStatus);
  }, [requests, selectedStatus]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const formatTime = (timeString) => timeString || "Not specified";

  const updateRequest = (appointmentId, patch) => {
    setRequests((prev) =>
      prev.map((request) =>
        request._id === appointmentId ? { ...request, ...patch } : request
      )
    );
  };

  const handleOfflineConsultation = async (appointmentId) => {
    try {
      setProcessingConsultation((prev) => ({ ...prev, [appointmentId]: true }));
      const response = await setConsultationMode(appointmentId, "offline");

      if (response?.success) {
        toast.success(
          "Offline consultation selected. Visit the clinic on your appointment date."
        );
        updateRequest(appointmentId, {
          consultationMode: "offline",
          paymentStatus: "unpaid",
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to set offline consultation");
    } finally {
      setProcessingConsultation((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleOnlineConsultation = async (appointmentId) => {
    try {
      setProcessingPayment((prev) => ({ ...prev, [appointmentId]: true }));
      const paymentResponse = await initiatePayment(appointmentId);

      if (paymentResponse?.success && paymentResponse.key && paymentResponse.orderId) {
        const options = {
          key: paymentResponse.key,
          amount: paymentResponse.amount,
          currency: paymentResponse.currency,
          order_id: paymentResponse.orderId,
          handler: async (response) => {
            try {
              const verifyResponse = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyResponse?.success) {
                toast.success("Payment successful. Chat enabled.");
                updateRequest(appointmentId, {
                  consultationMode: "online",
                  paymentStatus: "paid",
                  isChatEnabled: true,
                });
                setTimeout(() => navigate(`/chat/${appointmentId}`), 1000);
              }
            } catch (error) {
              toast.error(error.message || "Payment verification failed");
            }
          },
          prefill: userPrefill,
          theme: { color: "#0f766e" },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error("Failed to initiate payment");
      }
    } catch (error) {
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setProcessingPayment((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleStartChat = async (appointmentId) => {
    try {
      const chatResponse = await checkChatAccess(appointmentId);
      if (chatResponse?.canAccess) {
        navigate(`/chat/${appointmentId}`);
      } else {
        toast.error(chatResponse?.reason || "Chat access not available");
      }
    } catch (error) {
      toast.error(error.message || "Failed to access chat");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 p-6 text-white md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Patient Portal</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">My Requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-cyan-100 md:text-base">
            Track approvals, pick consultation mode, and continue eligible chats from one place.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Requests", value: stats.total, tone: "text-slate-900" },
            { label: "Approved", value: stats.approved, tone: "text-emerald-700" },
            { label: "Pending", value: stats.pending, tone: "text-amber-700" },
            { label: "Rejected", value: stats.rejected, tone: "text-rose-700" },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${stat.tone}`}>{stat.value || 0}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-cyan-700 bg-cyan-700 text-white"
                      : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-xl font-semibold text-slate-800">No requests found</h2>
              <p className="mt-2 text-slate-600">
                {selectedStatus === "ALL"
                  ? "You have not submitted any appointment request yet."
                  : `No ${selectedStatus.toLowerCase()} requests at this time.`}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const status = STATUS_META[request.approvalstatus] || STATUS_META.DEFAULT;
              return (
                <article
                  key={request._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {request.doctorId?.fullName || "Doctor"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {request.doctorId?.specialization || "Medical Professional"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.chip}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Date</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatDate(request.appointmentDate)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Time</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatTime(request.appointmentTime)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Reason</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {request.reason || "General Consultation"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Payment Status
                      </p>
                      <p className="mt-1 font-medium capitalize text-slate-900">
                        {request.paymentStatus || "unpaid"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Requested On
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Request ID</p>
                      <p className="mt-1 truncate font-mono text-xs text-slate-700">{request._id}</p>
                    </div>
                  </div>

                  {request.doctorId?.contact && (
                    <p className="mt-4 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Doctor contact:</span>{" "}
                      {request.doctorId.contact}
                    </p>
                  )}

                  {request.approvalstatus === "PENDING" && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Request is pending review by the doctor.
                    </div>
                  )}

                  {request.approvalstatus === "APPROVED" && !request.consultationMode && (
                    <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                      <p className="text-sm font-medium text-cyan-900">
                        Approved. Choose a consultation method.
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => handleOfflineConsultation(request._id)}
                          disabled={processingConsultation[request._id]}
                          className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {processingConsultation[request._id]
                            ? "Saving..."
                            : "Visit Clinic"}
                        </button>
                        <button
                          onClick={() => handleOnlineConsultation(request._id)}
                          disabled={processingPayment[request._id]}
                          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {processingPayment[request._id]
                            ? "Processing..."
                            : "Pay and Start Chat"}
                        </button>
                      </div>
                    </div>
                  )}

                  {request.approvalstatus === "APPROVED" &&
                    request.consultationMode === "offline" && (
                      <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
                        Offline consultation selected. Please visit the clinic on the
                        appointment date.
                      </div>
                    )}

                  {request.approvalstatus === "APPROVED" &&
                    request.consultationMode === "online" &&
                    request.paymentStatus !== "paid" && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-medium text-amber-900">
                          Complete payment to start online consultation.
                        </p>
                        <button
                          onClick={() => handleOnlineConsultation(request._id)}
                          disabled={processingPayment[request._id]}
                          className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {processingPayment[request._id]
                            ? "Processing..."
                            : "Proceed to Payment"}
                        </button>
                      </div>
                    )}

                  {request.approvalstatus === "APPROVED" &&
                    request.consultationMode === "online" &&
                    request.paymentStatus === "paid" &&
                    request.isChatEnabled && (
                      <div className="mt-5">
                        <button
                          onClick={() => handleStartChat(request._id)}
                          className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800"
                        >
                          Start Chat with Doctor
                        </button>
                      </div>
                    )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default MyRequests;
