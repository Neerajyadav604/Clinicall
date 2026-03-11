import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Ambulance,
  ArrowUpDown,
  BadgeCheck,
  Brain,
  HeartPulse,
  IndianRupee,
  MapPin,
  Mic,
  MicOff,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";
import { toast } from "react-toastify";
import { requestAppointment, searchDoctors } from "../services/operations/SearchApi";

const QUICK_SPECIALTIES = [
  { label: "Cardiologist", icon: HeartPulse },
  { label: "Dentist", icon: BadgeCheck },
  { label: "Dermatologist", icon: Sparkles },
  { label: "Neurologist", icon: Brain },
  { label: "Psychologist", icon: UserRound },
  { label: "General Physician", icon: Stethoscope },
];

const POPULAR_SERVICES = [
  { title: "Online Consultation", subtitle: "Chat and guided care", icon: Stethoscope },
  { title: "Video Call", subtitle: "Face-to-face checkup", icon: Video },
  { title: "Nearby Doctors", subtitle: "Find clinics near you", icon: MapPin },
  { title: "Emergency Care", subtitle: "Priority appointment", icon: Ambulance },
];

const RECOMMENDED_DOCTORS = [
  {
    _id: "rec-1",
    fullName: "Dr. Priya Sharma",
    specialization: "Dermatologist",
    experienceYears: 11,
    consultationFee: 700,
    rating: 4.8,
    availabilityStatus: "Available Today",
  },
  {
    _id: "rec-2",
    fullName: "Dr. Vivek Menon",
    specialization: "Cardiologist",
    experienceYears: 14,
    consultationFee: 1200,
    rating: 4.9,
    availabilityStatus: "Next Available: 5:30 PM",
  },
  {
    _id: "rec-3",
    fullName: "Dr. Ananya Das",
    specialization: "General Physician",
    experienceYears: 8,
    consultationFee: 500,
    rating: 4.7,
    availabilityStatus: "Available Today",
  },
];

const RECENT_SEARCHES_KEY = "appointment_recent_searches";
const RECENT_BOOKINGS_KEY = "appointment_recent_bookings";

const mapButtonStatus = (status) => {
  if (!status) return "Book Appointment";
  const normal = status.toLowerCase();
  if (normal.includes("request") && normal.includes("sent")) return "Pending Approval";
  if (normal.includes("pending")) return "Pending Approval";
  if (normal.includes("accepted") || normal.includes("approve")) return "Request Accepted";
  if (normal.includes("reject")) return "Rejected";
  if (normal.includes("book") || normal.includes("request")) return "Book Appointment";
  return status;
};

const readLocalList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeLocalList = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // ignore localStorage write errors
  }
};

const normalizeDoctor = (doctor) => {
  const ratingValue = Number(doctor?.rating ?? doctor?.averageRating ?? 4.6);
  const experienceValue = Number(doctor?.experienceYears ?? doctor?.experience ?? 6);
  const feeValue = Number(
    doctor?.consultationFee ?? doctor?.consultationFees ?? doctor?.fee ?? 600
  );

  return {
    ...doctor,
    rating: Number.isFinite(ratingValue) ? ratingValue : 4.6,
    experienceYears: Number.isFinite(experienceValue) ? experienceValue : 6,
    consultationFee: Number.isFinite(feeValue) ? feeValue : 600,
    availabilityStatus:
      doctor?.availabilityStatus ||
      (doctor?.isAvailable === false ? "Slots Filling Fast" : "Available Today"),
    buttonStatus: mapButtonStatus(doctor?.buttonStatus),
  };
};

const Apponintment = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);
  const micTriggeredRef = useRef(false);
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [selectedPrice, setSelectedPrice] = useState("ALL");
  const [sortBy, setSortBy] = useState("relevance");
  const [showBook, setShowBook] = useState(null);
  const [bookingData, setBookingData] = useState({
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() =>
    readLocalList(RECENT_SEARCHES_KEY)
  );
  const [recentBookings, setRecentBookings] = useState(() =>
    readLocalList(RECENT_BOOKINGS_KEY)
  );

  const availableSpecialties = useMemo(() => {
    const set = new Set(
      doctors.map((doctor) => doctor.specialization).filter(Boolean)
    );
    return ["ALL", ...Array.from(set)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const filtered = doctors.filter((doctor) => {
      const specialtyPass =
        selectedSpecialty === "ALL" || doctor.specialization === selectedSpecialty;
      const ratingPass =
        selectedRating === "ALL" ||
        (selectedRating === "4.5+" && doctor.rating >= 4.5) ||
        (selectedRating === "4.0+" && doctor.rating >= 4.0);
      const pricePass =
        selectedPrice === "ALL" ||
        (selectedPrice === "UNDER_500" && doctor.consultationFee < 500) ||
        (selectedPrice === "500_1000" &&
          doctor.consultationFee >= 500 &&
          doctor.consultationFee <= 1000) ||
        (selectedPrice === "ABOVE_1000" && doctor.consultationFee > 1000);

      return specialtyPass && ratingPass && pricePass;
    });

    const sortable = [...filtered];
    if (sortBy === "rating_desc") {
      sortable.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "fee_asc") {
      sortable.sort((a, b) => a.consultationFee - b.consultationFee);
    } else if (sortBy === "experience_desc") {
      sortable.sort((a, b) => b.experienceYears - a.experienceYears);
    }
    return sortable;
  }, [doctors, selectedPrice, selectedRating, selectedSpecialty, sortBy]);

  const updateRecentSearches = (query) => {
    const normalized = query.trim();
    if (!normalized) return;
    const updated = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(
      0,
      6
    );
    setRecentSearches(updated);
    writeLocalList(RECENT_SEARCHES_KEY, updated);
  };

  const updateRecentBookings = (doctor, payload) => {
    const item = {
      doctorName: doctor.fullName,
      specialization: doctor.specialization || "Specialist",
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime,
    };
    const updated = [item, ...recentBookings].slice(0, 4);
    setRecentBookings(updated);
    writeLocalList(RECENT_BOOKINGS_KEY, updated);
  };

  const runSearch = async (rawQuery) => {
    const query = rawQuery.trim();
    if (!query) {
      setHasSearched(false);
      setDoctors([]);
      setSearchError("");
      return;
    }

    setLoadingSearch(true);
    setHasSearched(true);
    setSearchError("");

    try {
      const response = await searchDoctors(query);
      if (response?.success && Array.isArray(response.doctors)) {
        const normalizedDoctors = response.doctors.map(normalizeDoctor);
        setDoctors(normalizedDoctors);
        if (normalizedDoctors.length === 0) {
          setSearchError("No doctors matched your search. Try a broader specialty.");
        }
        updateRecentSearches(query);
      } else {
        setDoctors([]);
        setSearchError(response?.message || "No doctors found for this query.");
      }
    } catch (error) {
      setDoctors([]);
      setSearchError("Search failed. Please try again.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await runSearch(searchQuery);
  };

  const handleMicClick = () => {
    setMicError(null);
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocalhost) {
      setMicError(
        "Voice search requires HTTPS (or localhost). Please use a secure connection."
      );
      return;
    }

    if (!SpeechRecognition) {
      setMicError(
        "Voice search is not supported in your browser. Please use Chrome."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setMicError(null);
      micTriggeredRef.current = true;
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setSearchQuery(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        setMicError(
          "Microphone access denied. Please allow mic permissions in your browser."
        );
      } else if (event.error === "no-speech") {
        setMicError("No speech detected. Please try again.");
      } else {
        setMicError("Something went wrong. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      setMicError("Unable to start microphone. Please try again.");
    }
  };

  const handleSpecialtySearch = async (value) => {
    setSearchQuery(value);
    await runSearch(value);
  };

  const handleOpenBooking = (doctorId) => {
    setShowBook(doctorId);
    setBookingData({ appointmentDate: "", appointmentTime: "", reason: "" });
  };

  const handleBookingSubmit = async () => {
    if (!showBook) return;
    if (!bookingData.appointmentDate || !bookingData.appointmentTime || !bookingData.reason) {
      toast.error("Please fill date, time and reason.");
      return;
    }

    setSubmittingBooking(true);
    try {
      await requestAppointment(showBook, bookingData);
      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor._id === showBook
            ? { ...doctor, buttonStatus: "Pending Approval" }
            : doctor
        )
      );
      const selectedDoctor = doctors.find((doctor) => doctor._id === showBook);
      if (selectedDoctor) {
        updateRecentBookings(selectedDoctor, bookingData);
      }
      toast.success("Appointment request sent.");
      setShowBook(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send request.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleShareDoctor = async (doctor) => {
    const shareData = {
      title: doctor.fullName,
      text: `${doctor.fullName} | ${doctor.specialization} | ${doctor.rating.toFixed(
        1
      )} star rating`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        toast.success("Doctor details copied to clipboard.");
      }
    } catch (error) {
      // user cancelled share
    }
  };

  const handleViewProfile = (doctor) => {
    toast.info(
      `${doctor.fullName} | ${doctor.specialization} | ${doctor.experienceYears} years experience`
    );
  };

  useEffect(() => {
    if (!isListening && micTriggeredRef.current && searchQuery) {
      micTriggeredRef.current = false;
      runSearch(searchQuery);
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const renderDoctorCard = (doctor) => (
    <article
      key={doctor._id}
      className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_18px_38px_-24px_rgba(15,23,42,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-24px_rgba(15,23,42,0.38)]"
    >
      <div className="relative h-44 bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50">
        {doctor.image ? (
          <img
            src={doctor.image}
            alt={doctor.fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <UserRound className="h-16 w-16" />
          </div>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {doctor.rating.toFixed(1)}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          {doctor.availabilityStatus}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{doctor.fullName}</h3>
          <p className="text-sm text-slate-600">{doctor.specialization || "Specialist"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Experience</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {doctor.experienceYears} years
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Consultation</p>
            <p className="mt-1 inline-flex items-center text-sm font-semibold text-slate-800">
              <IndianRupee className="mr-0.5 h-3.5 w-3.5" />
              {doctor.consultationFee}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleOpenBooking(doctor._id)}
            disabled={doctor.buttonStatus !== "Book Appointment"}
            className="col-span-2 rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {doctor.buttonStatus}
          </button>
          <button
            type="button"
            onClick={() => handleViewProfile(doctor)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            View
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleShareDoctor(doctor)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </article>
  );

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <section className="sticky top-24 z-30 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm backdrop-blur">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="flex h-12 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-cyan-700 focus-within:bg-white">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search doctors, specialties, symptoms..."
                  className="h-full flex-1 bg-transparent px-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  aria-label="Search doctor"
                />
              </div>
              <button
                type="button"
                onClick={handleMicClick}
                title={isListening ? "Stop listening" : "Search by voice"}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white transition active:scale-[0.98] ${
                  isListening
                    ? "text-red-500 scale-110"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
                aria-label="Voice search"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 active:scale-[0.98]"
              >
                Search
              </button>
            </form>
            {isListening && (
              <div className="flex items-center gap-2 mt-1 px-2">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
                <span className="text-xs text-red-500 font-medium">Listening...</span>
              </div>
            )}
            {micError && (
              <p className="text-xs text-red-400 mt-1 px-2">{micError}</p>
            )}

            {hasSearched && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </button>

                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="rating_desc">Highest Rating</option>
                    <option value="fee_asc">Lowest Fee</option>
                    <option value="experience_desc">Most Experience</option>
                  </select>
                </div>
              </div>
            )}

            {hasSearched && showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Specialty</p>
                  <select
                    value={selectedSpecialty}
                    onChange={(event) => setSelectedSpecialty(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:outline-none"
                  >
                    {availableSpecialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Rating</p>
                  <select
                    value={selectedRating}
                    onChange={(event) => setSelectedRating(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All ratings</option>
                    <option value="4.5+">4.5 and above</option>
                    <option value="4.0+">4.0 and above</option>
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Price</p>
                  <select
                    value={selectedPrice}
                    onChange={(event) => setSelectedPrice(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All prices</option>
                    <option value="UNDER_500">Under 500</option>
                    <option value="500_1000">500 - 1000</option>
                    <option value="ABOVE_1000">Above 1000</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {!hasSearched ? (
            <section className="space-y-6">
              <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-gradient-to-br from-cyan-900 via-cyan-800 to-slate-900 p-6 text-white shadow-[0_30px_60px_-36px_rgba(15,23,42,0.65)]">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">
                  Digital Care
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight">
                  Find the right doctor for you
                </h1>
                <p className="mt-2 max-w-lg text-sm text-cyan-100">
                  Discover top specialists, compare profiles, and request appointments in a few taps.
                </p>
              </article>

              <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Quick Specialties</h2>
                  <span className="text-xs text-slate-500">Tap to search</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {QUICK_SPECIALTIES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleSpecialtySearch(item.label)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50 active:scale-[0.98]"
                      >
                        <Icon className="h-5 w-5 text-cyan-700" />
                        <p className="mt-2 text-sm font-medium text-slate-800">{item.label}</p>
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">Recommended Doctors</h2>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {RECOMMENDED_DOCTORS.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="min-w-[230px] rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {doctor.rating}
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-slate-900">{doctor.fullName}</h3>
                      <p className="text-xs text-slate-600">{doctor.specialization}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        {doctor.experienceYears} yrs experience
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSpecialtySearch(doctor.specialization)}
                        className="mt-3 w-full rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Explore
                      </button>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">Popular Services</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {POPULAR_SERVICES.map((service) => {
                    const Icon = service.icon;
                    return (
                      <div key={service.title} className="rounded-2xl bg-slate-50 p-3">
                        <Icon className="h-5 w-5 text-cyan-700" />
                        <p className="mt-2 text-sm font-semibold text-slate-800">{service.title}</p>
                        <p className="text-xs text-slate-600">{service.subtitle}</p>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">Recent Searches / Bookings</h2>
                {recentSearches.length === 0 && recentBookings.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm text-slate-700">No recent activity yet.</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Search any specialty to start booking faster next time.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSpecialtySearch("General Physician")}
                      className="mt-3 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Search Doctors
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Recent searches
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => handleSpecialtySearch(term)}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {recentBookings.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Recent bookings
                        </p>
                        <div className="mt-2 space-y-2">
                          {recentBookings.map((item, index) => (
                            <div
                              key={`${item.doctorName}-${index}`}
                              className="flex items-start justify-between rounded-xl bg-slate-50 p-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {item.doctorName}
                                </p>
                                <p className="text-xs text-slate-600">{item.specialization}</p>
                              </div>
                              <p className="text-xs text-slate-500">
                                {item.appointmentDate} {item.appointmentTime}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            </section>
          ) : (
            <section className="space-y-4">
              {loadingSearch && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-80 animate-pulse rounded-[20px] border border-slate-200 bg-white"
                    />
                  ))}
                </div>
              )}

              {!loadingSearch && filteredDoctors.length === 0 && (
                <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="text-lg font-semibold text-slate-800">No results found</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {searchError ||
                      "No doctors match your current filters. Adjust filters and try again."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setHasSearched(false);
                      setSearchQuery("");
                      setSearchError("");
                    }}
                    className="mt-4 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Explore Specialties
                  </button>
                </div>
              )}

              {!loadingSearch && filteredDoctors.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredDoctors.map(renderDoctorCard)}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {showBook && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 md:items-center md:justify-center">
          <div className="w-full rounded-t-3xl bg-white p-5 md:max-w-md md:rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Request Appointment</h3>
            <p className="mt-1 text-sm text-slate-600">
              Confirm date, time, and reason to send request.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  value={bookingData.appointmentDate}
                  onChange={(event) =>
                    setBookingData((prev) => ({
                      ...prev,
                      appointmentDate: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Time</label>
                <input
                  type="time"
                  value={bookingData.appointmentTime}
                  onChange={(event) =>
                    setBookingData((prev) => ({
                      ...prev,
                      appointmentTime: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Reason</label>
                <textarea
                  rows={3}
                  value={bookingData.reason}
                  onChange={(event) =>
                    setBookingData((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="Briefly describe your concern"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowBook(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBookingSubmit}
                disabled={submittingBooking}
                className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {submittingBooking ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

    
    </>
  );
};

export default Apponintment;
