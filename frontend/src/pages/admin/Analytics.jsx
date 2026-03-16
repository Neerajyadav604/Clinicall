import React, { useEffect, useState } from 'react';
import TrendChart from '../../components/admin/TrendChart';
import TopDoctorsTable from '../../components/admin/TopDoctorsTable';
import { getAnalyticsOverview, getTrendData, getTopDoctors } from '../../services/adminApi';

const Analytics = () => {
  const [overview, setOverview] = useState({});
  const [trends, setTrends] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, trendsRes, topDoctorsRes] = await Promise.all([
        getAnalyticsOverview(),
        getTrendData(),
        getTopDoctors(),
      ]);
      setOverview(overviewRes.data || {});
      setTrends(trendsRes.data || []);
      setTopDoctors(topDoctorsRes.data || []);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Users</h3>
            <p>{loading ? "..." : overview.users || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Doctors</h3>
            <p>{loading ? "..." : overview.doctors || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Appointments</h3>
            <p>{loading ? "..." : overview.appointments || 0}</p>
          </div>
        </div>
        {!loading ? (
          <>
            <TrendChart data={trends} />
            <TopDoctorsTable data={topDoctors} />
          </>
        ) : (
          <div className="bg-white p-4 rounded shadow text-sm text-gray-500">
            Loading analytics...
          </div>
        )}
      </div>
  );
};

export default Analytics;
