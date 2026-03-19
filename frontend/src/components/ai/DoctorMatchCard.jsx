import PropTypes from "prop-types";

const DoctorMatchCard = ({ doctor, onBook }) => {
  const getAvatarColor = (percentage) => {
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 60) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    return "text-gray-600";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const matchPercentage = doctor.matchPercentage || Math.round((doctor.matchScore || 0) * 100);

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 bg-white border border-gray-100 rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-md hover:border-gray-200 transition-all">
      {/* Avatar */}
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-semibold flex-shrink-0 min-h-[44px] ${getAvatarColor(matchPercentage)}`}>
        <span className="text-xs sm:text-sm md:text-base">{getInitials(doctor.name)}</span>
      </div>

      {/* Middle Content */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-2 sm:mb-3">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base leading-tight">{doctor.name}</h3>
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full w-fit">
            <span aria-hidden="true">🤖</span>
            <span>AI Match</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed">{doctor.specialization}</p>

        {doctor.matchReason && (
          <p className="text-xs sm:text-xs text-gray-500 italic mb-3 sm:mb-4 leading-relaxed">{doctor.matchReason}</p>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-xs md:text-sm text-gray-600 leading-relaxed">
          {doctor.rating && (
            <div className="flex items-center gap-1">
              <span aria-hidden="true">⭐</span>
              <span><span className="sr-only">Rating:</span> {doctor.rating}/5</span>
            </div>
          )}
          {doctor.consultationFee && (
            <div className="flex items-center gap-1">
              <span aria-hidden="true">💰</span>
              <span><span className="sr-only">Fee:</span> ₹{Math.round(doctor.consultationFee)}</span>
            </div>
          )}
          {doctor.experience && (
            <div className="flex items-center gap-1">
              <span aria-hidden="true">🏆</span>
              <span><span className="sr-only">Experience:</span> {doctor.experience}yr</span>
            </div>
          )}
        </div>
      </div>

      {/* Score and Button */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-2 sm:gap-3 md:gap-4 flex-shrink-0 pt-2 sm:pt-0 sm:pl-4 sm:text-right border-t sm:border-t-0 sm:border-l">
        <div>
          <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${getScoreColor(matchPercentage)}`} role="img" aria-label={`Match percentage: ${matchPercentage}%`}>
            {matchPercentage}%
          </div>
          <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">match</p>
        </div>

        {onBook && (
          <button
            onClick={() => onBook(doctor.doctorId)}
            className="px-4 sm:px-3 md:px-4 py-2.5 sm:py-2 md:py-2.5 border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px] sm:min-h-[44px]"
            aria-label={`Book appointment with ${doctor.name}`}
          >
            Book
          </button>
        )}
      </div>
    </div>
  );
};

DoctorMatchCard.propTypes = {
  doctor: PropTypes.shape({
    doctorId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    specialization: PropTypes.string,
    matchScore: PropTypes.number,
    matchPercentage: PropTypes.number,
    matchReason: PropTypes.string,
    rating: PropTypes.number,
    experience: PropTypes.number,
    consultationFee: PropTypes.number,
  }).isRequired,
  onBook: PropTypes.func,
};

export default DoctorMatchCard;
