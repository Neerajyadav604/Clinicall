import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  // transform data for recharts
  const chartData = data.map(item => ({
    name: item._id.day || `${item._id.month}-${item._id.year}`,
    count: item.count
  }));
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Appointment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;