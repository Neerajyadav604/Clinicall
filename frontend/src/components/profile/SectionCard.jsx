import React from 'react';

export default function SectionCard({ title, children, footer }) {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-8 space-y-6">{children}</div>
      {footer && <div className="px-6 py-4 bg-gray-50">{footer}</div>}
    </div>
  );
}
