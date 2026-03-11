import React from 'react';

const TopDoctorsTable = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Top Doctors</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, idx) => (
            <tr key={idx}>
              <td className="px-4 py-2 whitespace-nowrap">{item.doctor.fullName}</td>
              <td className="px-4 py-2 whitespace-nowrap">{item.doctor.specialization}</td>
              <td className="px-4 py-2 whitespace-nowrap">{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopDoctorsTable;