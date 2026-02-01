import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRequests, getRequestsByStatus } from "../services/operations/requestApi";
import { setConsultationMode, checkChatAccess, initiatePayment, verifyPayment } from "../services/operations/consultationApi";
import { toast } from "react-toastify";

/**
 * MyRequests Component
 * Displays all user appointment requests with filtering by status
 */
const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
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

  // Status badge styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-300",
          dot: "bg-green-500",
        };
      case "REJECTED":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-300",
          dot: "bg-red-500",
        };
      case "PENDING":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-300",
          dot: "bg-yellow-500",
        };
      case "CANCELLED":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-300",
          dot: "bg-gray-500",
        };
      default:
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-300",
          dot: "bg-blue-500",
        };
    }
  };

  // Fetch requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);

        // Fetch requests and stats in parallel
        const [requestsRes, statsRes] = await Promise.all([
          getUserRequests("ALL"),
          getRequestsByStatus(),
        ]);

        if (requestsRes.success && Array.isArray(requestsRes.data)) {
          setRequests(requestsRes.data);
          setFilteredRequests(requestsRes.data);
        }

        if (statsRes.success) {
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

  // Filter requests by status
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    if (status === "ALL") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.approvalstatus === status));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return "Not specified";
    return timeString;
  };

  // Handle offline consultation
  const handleOfflineConsultation = async (appointmentId) => {
    try {
      setProcessingConsultation({ ...processingConsultation, [appointmentId]: true });
      const response = await setConsultationMode(appointmentId, "offline");
      
      if (response.success) {
        toast.success("Offline consultation selected. Visit the clinic on your appointment date.");
        
        // Update requests list
        const updatedRequests = requests.map((req) =>
          req._id === appointmentId
            ? { ...req, consultationMode: "offline", paymentStatus: "unpaid" }
            : req
        );
        setRequests(updatedRequests);
        setFilteredRequests(updatedRequests.filter((r) => 
          selectedStatus === "ALL" || r.approvalstatus === selectedStatus
        ));
      }
    } catch (error) {
      toast.error(error.message || "Failed to set offline consultation");
    } finally {
      setProcessingConsultation({ ...processingConsultation, [appointmentId]: false });
    }
  };

  // Handle online consultation with payment
  const handleOnlineConsultation = async (appointmentId) => {
    try {
      setProcessingPayment({ ...processingPayment, [appointmentId]: true });
      
      // Initiate payment
      const paymentResponse = await initiatePayment(appointmentId);
      
      console.log(paymentResponse)

      if (paymentResponse.success && paymentResponse.key && paymentResponse.orderId) {
       

        // Open Razorpay payment modal
        const options = {
          key: paymentResponse.key,
          amount: paymentResponse.amount,
          currency: paymentResponse.currency,
          order_id: paymentResponse.orderId,
          handler: async (response) => {
           

            try {
              // Verify payment
              const verifyResponse = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

             


              if (verifyResponse.success) {
                toast.success("Payment successful! Chat enabled.");
                
                // Update requests list
                const updatedRequests = requests.map((req) =>
                  req._id === appointmentId
                    ? { ...req, consultationMode: "online", paymentStatus: "paid", isChatEnabled: true }
                    : req
                );
                setRequests(updatedRequests);
                setFilteredRequests(updatedRequests.filter((r) => 
                  selectedStatus === "ALL" || r.approvalstatus === selectedStatus
                ));
                
                // Navigate to chat
                setTimeout(() => navigate(`/chat/${appointmentId}`), 1000);
              }
            } catch (error) {
              toast.error(error.message || "Payment verification failed");
            }
          },
          prefill: {
            name: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).fullName : "",
            email: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : "",
          },
          theme: {
            color: "#2563eb",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
      
        
        toast.error("Failed to initiate payment");
      }
    } catch (error) {
      

      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setProcessingPayment({ ...processingPayment, [appointmentId]: false });
    }
  };

  // Handle start chat button
  const handleStartChat = async (appointmentId) => {
    try {
      const chatResponse = await checkChatAccess(appointmentId);
      
      if (chatResponse.canAccess) {
        navigate(`/chat/${appointmentId}`);
      } else {
        toast.error(chatResponse.reason || "Chat access not available");
      }
    } catch (error) {
      toast.error(error.message || "Failed to access chat");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-3">My Requests</h1>
          <p className="text-blue-600 text-lg">
            Track and manage your appointment requests with doctors
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Approved", value: stats.approved, color: "green" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "Rejected", value: stats.rejected, color: "red" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-600"
            >
              <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-blue-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Filter by Status</h3>
          <div className="flex flex-wrap gap-3">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedStatus === status
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {selectedStatus === "ALL"
                  ? "You haven't submitted any appointment requests yet."
                  : `No ${selectedStatus.toLowerCase()} requests at this time.`}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusStyle = getStatusStyle(request.approvalstatus);
              return (
                <div
                  key={request._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-l-blue-600"
                >
                  {/* Header with Status */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-900">
                        {request.doctorId?.fullName || "Doctor"}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {request.doctorId?.specialization || "Medical Professional"}
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} font-semibold`}
                    >
                      <span className={`w-3 h-3 rounded-full ${statusStyle.dot}`}></span>
                      {request.approvalstatus}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Date */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-medium mb-1">DATE</p>
                      <p className="text-blue-900 font-semibold">
                        {formatDate(request.appointmentDate)}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-medium mb-1">TIME</p>
                      <p className="text-blue-900 font-semibold">
                        {formatTime(request.appointmentTime)}
                      </p>
                    </div>

                    {/* Reason */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-medium mb-1">REASON</p>
                      <p className="text-blue-900 font-semibold">
                        {request.reason || "General Consultation"}
                      </p>
                    </div>

                    {/* Status Detail */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-medium mb-1">PAYMENT STATUS</p>
                      <p className="text-blue-900 font-semibold capitalize">
                        {request.paymentStatus}
                      </p>
                    </div>

                    {/* Created Date */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-medium mb-1">REQUESTED ON</p>
                      <p className="text-blue-900 font-semibold">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>

                    {/* Request ID */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-medium mb-1">REQUEST ID</p>
                      <p className="text-blue-900 font-semibold text-xs truncate">
                        {request._id}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info if Available */}
                  {request.doctorId?.contact && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Contact:</span> {request.doctorId.contact}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {request.approvalstatus === "PENDING" && (
                    <div className="mt-4 flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        View Details
                      </button>
                    </div>
                  )}

                  {request.approvalstatus === "APPROVED" && !request.consultationMode && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 font-medium mb-3">
                        Doctor approved! Choose your consultation method:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleOfflineConsultation(request._id)}
                          disabled={processingConsultation[request._id]}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                        >
                          {processingConsultation[request._id] ? "Processing..." : "Visit Clinic"}
                        </button>
                        <button
                          onClick={() => handleOnlineConsultation(request._id)}
                          disabled={processingPayment[request._id]}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                        >
                          {processingPayment[request._id] ? "Processing..." : "Pay & Start Chat"}
                        </button>
                      </div>
                    </div>
                  )}

                  {request.approvalstatus === "APPROVED" && request.consultationMode === "offline" && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 font-medium">
                        ✓ Offline consultation selected. Visit the clinic on your appointment date.
                      </p>
                    </div>
                  )}

                  {request.approvalstatus === "APPROVED" && request.consultationMode === "online" && request.paymentStatus !== "paid" && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 font-medium mb-3">
                        Payment required to start online consultation
                      </p>
                      <button
                        onClick={() => handleOnlineConsultation(request._id)}
                        disabled={processingPayment[request._id]}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                      >
                        {processingPayment[request._id] ? "Processing..." : "Proceed to Payment"}
                      </button>
                    </div>
                  )}

                  {request.approvalstatus === "APPROVED" && 
                   request.consultationMode === "online" && 
                   request.paymentStatus === "paid" && 
                   request.isChatEnabled && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleStartChat(request._id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        💬 Start Chat with Doctor
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary Section */}
        {filteredRequests.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <p className="text-gray-700">
              You have{" "}
              <span className="font-bold text-blue-600">{stats.pending}</span> pending
              request(s),{" "}
              <span className="font-bold text-green-600">{stats.approved}</span> approved
              request(s), and{" "}
              <span className="font-bold text-red-600">{stats.rejected}</span> rejected
              request(s).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
