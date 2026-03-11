const analytics = require('../services/adminAnalytics.service');

exports.overview = async (req, res, next) => {
  try {
    const result = await analytics.getOverview();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.revenue = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const total = await analytics.getRevenue(start ? new Date(start) : null, end ? new Date(end) : null);
    res.json({ success: true, total });
  } catch (err){ next(err); }
};

exports.trends = async (req, res, next) => {
  try {
    const { period } = req.query;
    const data = await analytics.getAppointmentTrends(period);
    res.json({ success: true, data });
  } catch (err){ next(err); }
};

exports.topDoctors = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await analytics.getTopDoctors(parseInt(limit) || 5);
    res.json({ success: true, data });
  } catch (err){ next(err); }
};

exports.consultationRatio = async (req, res, next) => {
  try {
    const data = await analytics.getConsultationRatio();
    res.json({ success: true, data });
  } catch (err){ next(err); }
};