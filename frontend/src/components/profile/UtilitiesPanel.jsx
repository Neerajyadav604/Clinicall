import React from 'react';
import { Link } from 'react-router-dom';

export default function UtilitiesPanel() {
  return (
    <div className="space-y-4">
      <Link
        to="/changepassword"
        className="block px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Change Password
      </Link>
      <Link
        to="/support"
        className="block px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Help & Support
      </Link>
    </div>
  );
}
