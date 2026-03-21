import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../services/ApiConnector";
import {
  setRecordSummary,
  setMlLoading,
  setMlError,
  setMlServiceDown,
  selectRecordSummary,
  selectMlError,
  selectMlLoading,
  selectMlServiceDown,
} from "../../slices/mlSlice";

const AISummaryPanel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.profile || {});
  const recordSummary = useSelector(selectRecordSummary);
  const error = useSelector(selectMlError);
  const loading = useSelector(selectMlLoading);
  const mlServiceDown = useSelector(selectMlServiceDown);

  const handleLoadSummary = async () => {
    dispatch(setMlLoading({ summary: true }));
    dispatch(setMlError({ summary: null }));

    try {
      if (!user) {
        dispatch(setMlError({ summary: "User not logged in" }));
        return;
      }
      const userId = user._id || user.id;
      const { data } = await axiosInstance.get(`/ai/records/summary/${userId}`);

      if (data.mlServiceDown) {
        dispatch(setMlServiceDown(true));
        return;
      }

      if (data.success || data.summary) {
        dispatch(setRecordSummary(data));
        dispatch(setMlServiceDown(false));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load summary";
      dispatch(setMlError({ summary: msg }));
      if (err.response?.status === 503) {
        dispatch(setMlServiceDown(true));
      }
    } finally {
      dispatch(setMlLoading({ summary: false }));
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case "stable":
        return "bg-green-50 border-green-200";
      case "needs attention":
        return "bg-yellow-50 border-yellow-200";
      case "critical":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "stable":
        return "✓";
      case "needs attention":
        return "⚠";
      case "critical":
        return "🚨";
      default:
        return "ℹ";
    }
  };

  const getTrendWidth = (trend) => {
    switch (trend) {
      case "stable":
        return "w-1/3";
      case "needs attention":
        return "w-3/5";
      case "critical":
        return "w-5/6";
      default:
        return "w-1/4";
    }
  };

  const getRiskFlagColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "bg-red-50 border-l-4 border-red-600 text-red-800";
      case "MODERATE":
        return "bg-yellow-50 border-l-4 border-yellow-600 text-yellow-800";
      case "LOW":
        return "bg-blue-50 border-l-4 border-blue-600 text-blue-800";
      default:
        return "bg-gray-50 border-l-4 border-gray-600 text-gray-800";
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <h2 className="text-lg font-semibold text-gray-900">AI Health Summary</h2>
        </div>
        {!recordSummary && !loading.summary && (
          <button
            onClick={handleLoadSummary}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Generate Summary
          </button>
        )}
        {recordSummary && (
          <button
            onClick={handleLoadSummary}
            disabled={loading.summary}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading.summary ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      {/* ML Service Down */}
      {mlServiceDown && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          <span className="font-semibold">⚠️ AI features are temporarily unavailable.</span> The ML service may be
          starting up. Please try again in a moment.
        </div>
      )}

      {error.summary && !loading.summary && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.summary}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading.summary && (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          <p className="text-sm text-gray-500 mt-4">Analysing your medical records...</p>
        </div>
      )}

      {/* No Summary Yet */}
      {!recordSummary && !loading.summary && !mlServiceDown && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🤖</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your AI health summary will appear here</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            We analyse your conditions, medications, vitals, and allergies to generate a plain-English summary of
            your health.
          </p>
          <button
            onClick={handleLoadSummary}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Generate Summary
          </button>
        </div>
      )}

      {/* Summary Content */}
      {recordSummary && !loading.summary && (
        <div className="space-y-5">
          {/* Part 1 — Summary Text Box */}
          {recordSummary.summary && (
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <label className="text-sm font-medium text-blue-700 mb-3 block">Health Overview</label>
              <p className="text-gray-700 leading-relaxed text-sm">{recordSummary.summary}</p>
            </div>
          )}

          {/* Part 2 — Key Stats Grid */}
          {recordSummary.record_counts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <div className="text-2xl font-bold text-blue-600">{recordSummary.record_counts.conditions || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Conditions</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <div className="text-2xl font-bold text-green-600">{recordSummary.record_counts.medications || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Active Meds</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <div className="text-2xl font-bold text-red-600">{recordSummary.record_counts.allergies || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Allergies</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <div className="text-2xl font-bold text-orange-600">
                  {recordSummary.key_stats?.abnormal_vitals?.length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Vitals to Watch</p>
              </div>
            </div>
          )}

          {/* Part 3 — Health Trend Indicator */}
          {recordSummary.health_trend && (
            <div className={`rounded-lg p-4 border ${getTrendColor(recordSummary.health_trend)}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getTrendIcon(recordSummary.health_trend)}</span>
                <h4 className="font-semibold text-sm">Health trend: {recordSummary.health_trend}</h4>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${getTrendWidth(recordSummary.health_trend)} ${getTrendColor(recordSummary.health_trend)} bg-opacity-100 transition-all`} />
              </div>
            </div>
          )}

          {/* Part 4 — Risk Flags */}
          {recordSummary.risk_flags && recordSummary.risk_flags.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Risk Alerts ({recordSummary.risk_flags.length})</h4>
              <div className="space-y-2">
                {recordSummary.risk_flags.map((flag, idx) => (
                  <div key={idx} className={`rounded-lg p-3 ${getRiskFlagColor(flag.severity)}`}>
                    <div className="flex items-start gap-2">
                      {flag.flag === "ALLERGY_DRUG_CONFLICT" && <span className="text-lg">🚫</span>}
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-0.5">{flag.flag}</div>
                        <p className="text-sm">{flag.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Part 5 — Abnormal Vitals List */}
          {recordSummary.key_stats?.abnormal_vitals && recordSummary.key_stats.abnormal_vitals.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Vitals Requiring Attention</h4>
              <div className="flex flex-wrap gap-2">
                {recordSummary.key_stats.abnormal_vitals.map((vital, idx) => (
                  <span key={idx} className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    {vital}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Part 6 — Key Terms */}
          {recordSummary.key_terms && recordSummary.key_terms.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Key Medical Terms</label>
              <div className="flex flex-wrap gap-2">
                {recordSummary.key_terms.map((term, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Part 8 — Record Counts */}
          {recordSummary.record_counts && (
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-200">
              <p>
                Analysed: {recordSummary.record_counts.conditions} conditions · {recordSummary.record_counts.observations || 0}{" "}
                observations · {recordSummary.record_counts.medications} medications · {recordSummary.record_counts.allergies}{" "}
                allergies
              </p>
            </div>
          )}

          {/* Part 7 — Footer */}
          <div className="text-xs text-gray-400 pt-3 border-t border-gray-200">
            <p className="mb-1">
              {recordSummary.lastUpdated && `Last updated: ${new Date(recordSummary.lastUpdated).toLocaleString()}`}
            </p>
            <p className="italic">This summary is AI-generated and not a medical diagnosis.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummaryPanel;
