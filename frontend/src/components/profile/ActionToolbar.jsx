import React from 'react';

export default function ActionToolbar({ onSave, saving, extraButtons = [] }) {
  return (
    <div className="flex items-center space-x-3">
      {extraButtons.map((btn, idx) => (
        <React.Fragment key={idx}>{btn}</React.Fragment>
      ))}
      <button
        onClick={onSave}
        disabled={saving}
        className={`px-5 py-2 rounded-lg font-semibold text-white transition-colors duration-150
          ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
