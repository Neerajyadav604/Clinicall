const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

exports.getOverview = async () => {
  const [users, doctors, appointments] = await Promise.all([
    User.countDocuments(),
    Doctor.countDocuments({ verificationStatus: 'APPROVED' }),
    Appointment.countDocuments()
  ]);
  return { users, doctors, appointments };
};

exports.getRevenue = async (start, end) => {
  const match = { paid: true };
  if (start) match.createdAt = { $gte: start };
  if (end) match.createdAt = match.createdAt ? { ...match.createdAt, $lte: end } : { $lte: end };
  const data = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return data[0]?.total || 0;
};

exports.getAppointmentTrends = async (period = 'daily') => {
  const group = period === 'monthly' ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } } : { day: { $dayOfYear: '$createdAt' } };
  const data = await Appointment.aggregate([
    { $group: { _id: group, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1 || 1 } }
  ]);
  return data;
};

exports.getTopDoctors = async (limit = 5) => {
  const data = await Appointment.aggregate([
    { $match: { approvalstatus: 'APPROVED' } },
    { $group: { _id: '$doctorId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
    { $unwind: '$doctor' }
  ]);
  return data;
};

exports.getConsultationRatio = async () => {
  const data = await Appointment.aggregate([
    { $group: { _id: '$mode', count: { $sum: 1 } } }
  ]);
  return data; // expects [{_id:'online',count:..},{_id:'offline',count:..}]
};