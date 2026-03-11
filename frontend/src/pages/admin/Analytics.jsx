import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import TrendChart from '../../components/admin/TrendChart';
import TopDoctorsTable from '../../components/admin/TopDoctorsTable';
import { getAnalyticsOverview, getTrendData, getTopDoctors } from '../../services/adminApi';

const Analytics = () => {
  const [overview, setOverview] = useState({});
  const [trends, setTrends] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);

  useEffect(() => {
    fetchOverview();
    fetchTrends();
    fetchTopDoctors();
  }, []);

  const fetchOverview = async () => {
    const res = await getAnalyticsOverview();
    setOverview(res.data || {});
  };
  const fetchTrends = async () => {
    const res = await getTrendData();
    setTrends(res.data || []);
  };
  const fetchTopDoctors = async () => {
    const res = await getTopDoctors();
    setTopDoctors(res.data || []);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Users</h3>
            <p>{overview.users || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Doctors</h3>
            <p>{overview.doctors || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Appointments</h3>
            <p>{overview.appointments || 0}</p>
          </div>
        </div>
        <TrendChart data={trends} />
        <TopDoctorsTable data={topDoctors} />
      </div>
    </AdminLayout>
  );
};

export default Analytics;