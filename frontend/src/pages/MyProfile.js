import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Flag, User, Upload, Camera } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { updateDisplayPicture } from '../services/operations/Profileapi';

const MyProfile = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    const { user } = useSelector((state) => state.profile);
     console.log("user", user);
    console.log("Medication:", user?.medications, "medicalHistory:", user?.medicalHistory);
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewSource, setPreviewSource] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log("Selected file:", file);
        if (file) {
            setImageFile(file);
            setUploadSuccess(false);
            previewFile(file);
        }
    };

    const previewFile = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setPreviewSource(reader.result);
        };
    };

    const handleFileUpload = async () => {
        if (!imageFile) {
            console.error("No file selected!");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("displayPicture", imageFile);

            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            await dispatch(updateDisplayPicture(token, formData));
            setUploadSuccess(true);
            setImageFile(null);
            setPreviewSource(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (error) {
            console.error("Upload Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelUpload = () => {
        setImageFile(null);
        setPreviewSource(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (imageFile) {
            previewFile(imageFile);
        }
    }, [imageFile]);

   

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 mt-24">
                <div className="text-gray-600">Failed to load profile</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 p-4 md:p-8 mt-24">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
                    {/* Header Section with Image in Top Right */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        {/* Left Side - Main Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl md:text-4xl font-normal text-gray-800">
                                            {user.fullName}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-gray-500 text-sm">
                                            {user.address ?
                                                user.address.split(',').slice(-2).join(',').trim() :
                                                'Location not set'}
                                        </span>
                                    </div>
                                    <p className="text-blue-500 text-sm font-medium mb-4">{user.role}</p>
                                </div>

                                <button className="p-2 hover:bg-gray-100 rounded md:hidden">
                                    <Flag className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Contact Info Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-500 text-xs uppercase mb-2">Email</p>
                                    <p className="text-gray-700 text-sm break-all">✉️ {user.email}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-500 text-xs uppercase mb-2">Phone</p>
                                    <p className="text-gray-700 text-sm">📱 {user.contact}</p>
                                </div>
                                {user.emergencyContact && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <p className="text-gray-500 text-xs uppercase mb-2">Emergency Contact</p>
                                        <p className="text-red-600 text-sm">🆘 {user.emergencyContact}</p>
                                    </div>
                                )}
                                {user.bloodGroup && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-gray-500 text-xs uppercase mb-2">Blood Group</p>
                                        <p className="text-blue-600 text-sm font-medium">🩸 {user.bloodGroup}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Link to="/editprofile" className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                    <User className="w-4 h-4" />
                                    Edit Profile
                                </Link>
                                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                                    <MessageSquare className="w-4 h-4" />
                                    Send message
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                                    <Users className="w-4 h-4" />
                                    Contacts
                                </button>
                            </div>
                        </div>

                        {/* Right Side - Profile Image */}
                        <div className="md:w-64 lg:w-80">
                            <div className="relative">
                                {previewSource || user.image ? (
                                    <img
                                        src={previewSource || user.image}
                                        alt={user.fullName}
                                        className="w-full aspect-square object-cover rounded-lg shadow-md"
                                    />
                                ) : (
                                    <div className="w-full aspect-square bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                        <User className="w-24 h-24 text-white" />
                                    </div>
                                )}
                                
                                {/* Upload overlay button */}
                                <button
                                    onClick={handleClick}
                                    className="absolute bottom-3 right-3 bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 shadow-lg transition-colors"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>

                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* Upload Controls */}
                            {imageFile && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-700 text-xs font-medium mb-3">New image selected</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleFileUpload}
                                            disabled={loading}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {loading ? 'Uploading...' : 'Upload'}
                                        </button>
                                        <button
                                            onClick={handleCancelUpload}
                                            disabled={loading}
                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Success message */}
                            {uploadSuccess && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-700 text-sm font-medium">✓ Profile picture updated successfully!</p>
                                </div>
                            )}

                            {/* Quick Stats Below Image */}
                            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-500 text-xs uppercase mb-2">Member Since</p>
                                <p className="text-gray-700 text-sm font-medium">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            {user.dob && (
                                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-500 text-xs uppercase mb-2">Date of Birth</p>
                                    <p className="text-gray-700 text-sm font-medium">
                                        {new Date(user.dob).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}

                            {user.gender && (
                                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-500 text-xs uppercase mb-2">Gender</p>
                                    <p className="text-gray-700 text-sm font-medium">{user.gender}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab */}
                    <div className="flex gap-8 border-b border-gray-200 mb-6">
                        <button className="flex items-center gap-2 pb-3 text-sm text-gray-700 border-b-2 border-gray-700">
                            <User className="w-4 h-4" />
                            About
                        </button>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Medical Information */}
                        <div>
                            <h3 className="text-gray-400 text-xs uppercase mb-4 font-semibold">Medical Information</h3>

                            {user.allergies && user.allergies.length > 0 && (
                                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-orange-700 text-xs uppercase font-semibold mb-2">⚠️ Allergies</p>
                                    <div className="space-y-1">
                                        {Array.isArray(user.allergies) ? (
                                            user.allergies.map((allergy, idx) => (
                                                <p key={idx} className="text-orange-800 text-sm">• {allergy}</p>
                                            ))
                                        ) : (
                                            <p className="text-orange-800 text-sm">{user.allergies}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user.medications && user.medications.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-gray-600 text-sm font-medium mb-2">Current Medications:</p>
                                    <div className="space-y-1">
                                        {Array.isArray(user.medications) ? (
                                            user.medications.map((med, idx) => (
                                                <p key={idx} className="text-gray-700 text-sm pl-4">• {med}</p>
                                            ))
                                        ) : (
                                            <p className="text-gray-700 text-sm pl-4">• {user.medications}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user.medicalHistory && user.medicalHistory.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-gray-600 text-sm font-medium mb-2">Medical History:</p>
                                    <div className="space-y-1">
                                        {Array.isArray(user.medicalHistory) ? (
                                            user.medicalHistory.map((history, idx) => (
                                                <p key={idx} className="text-gray-700 text-sm pl-4">• {history}</p>
                                            ))
                                        ) : (
                                            <p className="text-gray-700 text-sm pl-4">{user.medicalHistory}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user.insurance?.provider && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-blue-800 font-medium text-sm">Insurance Provider</h4>
                                        <span className="bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded">Active</span>
                                    </div>
                                    <p className="text-blue-700 text-sm font-medium">{user.insurance.provider}</p>
                                    {user.insurance.policyNumber && (
                                        <p className="text-blue-600 text-xs mt-1">Policy: {user.insurance.policyNumber}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Contact & Address Information */}
                        <div>
                            <h3 className="text-gray-400 text-xs uppercase mb-4 font-semibold">Contact & Address</h3>

                            {user.address && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-xs uppercase mb-2">Full Address</p>
                                    <p className="text-gray-700 text-sm leading-relaxed">{user.address}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📧</span>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase">Email Address</p>
                                        <p className="text-blue-500 text-sm hover:underline cursor-pointer">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📱</span>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase">Phone Number</p>
                                        <p className="text-blue-500 text-sm hover:underline cursor-pointer">{user.contact}</p>
                                    </div>
                                </div>

                                {user.emergencyContact && (
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">🆘</span>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase">Emergency Contact</p>
                                            <p className="text-red-500 text-sm hover:underline cursor-pointer">{user.emergencyContact}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 text-xs uppercase font-semibold mb-2">✓ Account Status</p>
                                <p className="text-green-800 text-sm">Active Member</p>
                                <p className="text-green-600 text-xs mt-1">
                                    Joined {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;