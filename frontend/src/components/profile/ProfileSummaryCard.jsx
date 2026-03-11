import React from 'react';
import AvatarUploader from './AvatarUploader';

export default function ProfileSummaryCard({ profile }) {
  if (!profile) return null;

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
      <div className="flex flex-col items-center">
        <AvatarUploader src={profile.image} disabled />
        <h2 className="mt-3 text-xl font-semibold text-gray-900">
          {profile.fullName}
        </h2>
        <p className="text-gray-500 text-sm">{profile.role}</p>
      </div>

      <div className="space-y-4">
        <InfoCard
          label="Member since"
          value={
            new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })
          }
        />

        {profile.dob && (
          <InfoCard
            label="Date of birth"
            value={
              new Date(profile.dob).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            }
          />
        )}
        {profile.gender && <InfoCard label="Gender" value={profile.gender} />}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-gray-500 text-xs uppercase">{label}</p>
      <p className="text-gray-700 text-sm font-medium">{value}</p>
    </div>
  );
}
