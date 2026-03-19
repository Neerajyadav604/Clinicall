import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../services/ApiConnector";
import symptomsData from "../../data/symptoms_list.json";
import {
  setSymptomPredictions,
  setRecommendedDoctors,
  setSelectedSymptoms,
  setMlLoading,
  setMlError,
  setMlServiceDown,
  selectSymptomPredictions,
  selectSelectedSymptoms,
  selectMlLoading,
  selectMlError,
  selectMlServiceDown,
  selectRecommendedDoctors,
} from "../../slices/mlSlice";
import DoctorMatchCard from "./DoctorMatchCard";

const SymptomChecker = () => {
  const dispatch = useDispatch();
  const symptomPredictions = useSelector(selectSymptomPredictions);
  const selectedSymptoms = useSelector(selectSelectedSymptoms);
  const loading = useSelector(selectMlLoading);
  const error = useSelector(selectMlError);
  const mlServiceDown = useSelector(selectMlServiceDown);
  const recommendedDoctors = useSelector(selectRecommendedDoctors);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [findingDoctors, setFindingDoctors] = useState(false);
  const dropdownRef = useRef(null);

  const ALL_SYMPTOMS = symptomsData.symptoms || [];

  const filteredSymptoms = ALL_SYMPTOMS.filter(
    (s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedSymptoms.includes(s)
  ).slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      dispatch(setSelectedSymptoms([...selectedSymptoms, symptom]));
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveSymptom = (symptom) => {
    dispatch(setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom)));
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) return;

    dispatch(setMlLoading({ symptoms: true }));
    dispatch(setMlError({ symptoms: null }));

    try {
      const { data } = await axiosInstance.post("/ai/symptoms/predict", {
        symptoms: selectedSymptoms,
      });

      if (data.mlServiceDown) {
        dispatch(setMlServiceDown(true));
        return;
      }

      if (data.success) {
        dispatch(setSymptomPredictions(data.predictions));
        dispatch(setMlServiceDown(false));
        setShowResults(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Prediction failed";
      dispatch(setMlError({ symptoms: msg }));
      if (err.response?.status === 503) {
        dispatch(setMlServiceDown(true));
      }
    } finally {
      dispatch(setMlLoading({ symptoms: false }));
    }
  };

  const handleFindDoctors = async () => {
    if (symptomPredictions.length === 0) return;

    setFindingDoctors(true);
    const topPrediction = symptomPredictions[0];

    try {
      const { data } = await axiosInstance.get("/ai/doctors/recommend", {
        params: {
          disease: topPrediction.disease,
          specialization:
            topPrediction.recommended_specialization || "General Physician",
        },
      });
      if (data.success) {
        dispatch(setRecommendedDoctors(data.recommended_doctors));
      }
    } catch (err) {
      console.error("Doctor recommendation failed:", err);
    } finally {
      setFindingDoctors(false);
    }
  };

  const handleClear = () => {
    dispatch(setSelectedSymptoms([]));
    dispatch(setSymptomPredictions([]));
    dispatch(setRecommendedDoctors([]));
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <span className="text-2xl sm:text-3xl md:text-4xl" aria-hidden="true">🧠</span>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 leading-tight">AI Symptom Checker</h2>
          </div>
          <p className="text-xs sm:text-xs md:text-sm text-gray-500 leading-relaxed">Powered by Random Forest ML</p>
        </div>
        {showResults && (
          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-[44px]"
          >
            Clear
          </button>
        )}
      </div>

      {/* ML Service Down Banner */}
      {mlServiceDown && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm text-yellow-800 leading-relaxed" role="alert">
          <span className="font-semibold block sm:inline">⚠️ AI features are temporarily unavailable.</span> The ML service may be starting up. Please try again in a moment.
        </div>
      )}

      {/* Symptom Input Area */}
      {!showResults && (
        <>
          <label htmlFor="symptom-input" className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3">Select your symptoms</label>

          <div ref={dropdownRef} className="relative mb-4 sm:mb-5 md:mb-6">
            <input
              id="symptom-input"
              type="text"
              placeholder="Search symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[44px]"
              aria-label="Search for symptoms"
              aria-owns="symptom-dropdown"
              aria-expanded={showDropdown && filteredSymptoms.length > 0}
            />

            {/* Dropdown */}
            {showDropdown && filteredSymptoms.length > 0 && (
              <ul id="symptom-dropdown" className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-52 overflow-y-auto z-50">
                {filteredSymptoms.map((symptom) => (
                  <li
                    key={symptom}
                    onClick={() => handleAddSymptom(symptom)}
                    className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 hover:bg-blue-50 cursor-pointer text-xs sm:text-sm md:text-base text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none focus:bg-blue-50 min-h-[44px] flex items-center"
                    role="option"
                  >
                    {symptom}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected Symptoms Chips */}
          {selectedSymptoms.length > 0 && (
            <div className="mb-4 sm:mb-5 md:mb-6">
              <label className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3 block">Selected symptoms ({selectedSymptoms.length}):</label>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
                {selectedSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => handleRemoveSymptom(symptom)}
                    className="bg-blue-100 text-blue-800 text-xs sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-blue-200 active:bg-blue-300 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] flex items-center justify-center"
                    aria-label={`Remove symptom: ${symptom}`}
                  >
                    {symptom} <span className="font-bold" aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">Click a symptom to remove it</p>
            </div>
          )}

          {/* Analyse Button */}
          <button
            onClick={handlePredict}
            disabled={selectedSymptoms.length === 0 || loading.symptoms}
            className="w-full py-2.5 sm:py-3 md:py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px]"
            aria-busy={loading.symptoms}
          >
            {loading.symptoms ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analysing symptoms...</span>
              </>
            ) : (
              `Analyse ${selectedSymptoms.length > 0 ? selectedSymptoms.length : ""} Symptom${selectedSymptoms.length !== 1 ? "s" : ""}`
            )}
          </button>

          {/* Error Display */}
          {error.symptoms && (
            <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 md:p-5 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700 leading-relaxed" role="alert">
              {error.symptoms}
            </div>
          )}
        </>
      )}

      {/* Results Panel */}
      {showResults && symptomPredictions.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Top Predictions</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 leading-relaxed">Based on ML analysis</p>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {symptomPredictions.map((prediction, idx) => {
              const borderColor =
                idx === 0 ? "border-blue-500" : idx === 1 ? "border-green-500" : "border-yellow-500";
              const confidenceColor =
                prediction.confidence >= 0.7
                  ? "text-green-600"
                  : prediction.confidence >= 0.4
                    ? "text-yellow-600"
                    : "text-red-600";

              return (
                <div
                  key={idx}
                  className={`border-l-4 ${borderColor} bg-white border border-gray-100 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-full text-xs sm:text-sm font-bold text-gray-700">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg leading-tight">{prediction.disease}</span>
                    </div>
                    <span className={`text-lg sm:text-xl md:text-2xl font-bold ${confidenceColor} flex-shrink-0`}>
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mb-3 sm:mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        prediction.confidence >= 0.7
                          ? "bg-green-500"
                          : prediction.confidence >= 0.4
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${prediction.confidence * 100}%` }}
                      aria-valuenow={Math.round(prediction.confidence * 100)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>

                  {prediction.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed">{prediction.description}</p>
                  )}

                  {prediction.precautions && prediction.precautions.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Precautions:</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5">
                        {prediction.precautions.map((precaution, pidx) => (
                          <span
                            key={pidx}
                            className="text-xs sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 rounded-full leading-tight"
                          >
                            {precaution}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction.symptoms_unknown && prediction.symptoms_unknown.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 sm:mt-3 leading-relaxed">
                      <strong>Note:</strong> {prediction.symptoms_unknown.length} symptom(s) not recognized by model:{" "}
                      {prediction.symptoms_unknown.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Find Doctors Button */}
          <button
            onClick={handleFindDoctors}
            disabled={findingDoctors}
            className="w-full py-2.5 sm:py-3 md:py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px]"
            aria-busy={findingDoctors}
          >
            {findingDoctors ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Finding doctors...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">🔍</span>
                <span>Find Matching Doctors for {symptomPredictions[0]?.disease}</span>
              </>
            )}
          </button>

          {/* Recommended Doctors */}
          {recommendedDoctors.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Matching Doctors</h4>
              <div className="space-y-3 sm:space-y-4">
                {recommendedDoctors.map((doctor) => (
                  <DoctorMatchCard key={doctor.doctorId} doctor={doctor} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
