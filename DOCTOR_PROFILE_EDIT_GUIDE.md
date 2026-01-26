# Doctor Profile Edit Feature - Implementation Guide

## Overview
This document describes the newly implemented doctor profile editing feature that allows doctors to update their profile information and profile picture.

## Features Implemented

### 1. Backend Updates
**File**: `server/routes/Doctor.js`

Added a new endpoint:
- **PUT /api/v1/profile/update** - Updates doctor's profile information
  - Requires authentication (`authenticateUser`)
  - Requires doctor role (`isDoctor`)
  - Accepts: fullName, email, contact, specialization, qualification, experienceYears, licenseNumber, hospitalName, documents, image
  - Returns: Updated doctor profile with populated user data

### 2. Frontend API Function
**File**: `frontend/src/services/doctorApi.js`

Added new API function:
- **updateDoctorProfile(profileData)** - Sends profile update request to backend
  - Parameters: Object containing profile fields to update
  - Returns: Response with success status and updated profile data

### 3. New Edit Profile Component
**File**: `frontend/src/pages/doctor/DoctorEditProfile.jsx`

A complete edit profile form with:
- **Profile Picture Management**
  - Display current profile picture
  - Upload new image with validation
  - File type checking (images only)
  - File size validation (max 5MB)
  - Real-time preview

- **Form Fields**
  - Full Name (required)
  - Email (required, validated)
  - Phone Number (required)
  - Specialization (required)
  - Qualification (optional)
  - Years of Experience (optional)
  - Medical License Number (required)
  - Hospital/Clinic Name (optional)
  - Verification Documents Links (optional)

- **Validation**
  - Client-side form validation
  - Required field checks
  - Email format validation
  - Error messages for each field

- **Features**
  - Real-time image preview
  - Cancel/Save buttons
  - Loading states during submission
  - Toast notifications for user feedback
  - Automatic redirect to profile page on success

### 4. Updated Routes
**File**: `frontend/src/routes/DoctorRoutes.jsx`

Added new route:
- **GET /doctor/edit-profile** - Edit profile page (protected with doctor role)

### 5. Updated Profile Page
**File**: `frontend/src/pages/doctor/DoctorProfile.jsx`

Enhanced with:
- Working "Edit Profile" button
- Navigation to edit page
- Auto-refresh mechanism when returning from edit page

## How to Use

### For Doctors
1. Navigate to **Doctor Dashboard** → **My Profile**
2. Click the **"Edit Profile"** button
3. Update desired fields:
   - Change profile picture by clicking the camera icon
   - Update any text fields
   - Add or update document links
4. Click **"Save Changes"** to submit
5. You'll be redirected to your profile page showing updated information

### Important Notes
- **Required Fields**: Full Name, Email, Contact, Specialization, License Number
- **Image Upload**: 
  - Accepts: JPG, PNG, GIF, WebP formats
  - Max size: 5MB
  - Currently stores as base64 (you can integrate Cloudinary for cloud storage)
- **Documents**: Enter multiple URLs separated by new lines

## Image Upload Configuration

The system currently stores images as base64. To use Cloudinary for cloud storage:

1. Get your Cloudinary credentials:
   - Cloud Name
   - Upload Preset

2. Update `DoctorEditProfile.jsx` line ~165:
```javascript
const cloudinaryResponse = await fetch(
  "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
  {
    method: "POST",
    body: fileData,
  }
);
```

Replace `YOUR_CLOUD_NAME` with your actual Cloudinary cloud name.

## Database Updates

The `Doctor` model stores the following fields:
- `image` (String) - Profile picture URL or base64
- `fullName` - Doctor's name
- `email` - Email address
- `contact` - Phone number
- `specialization` - Medical specialty
- `qualification` - Educational qualifications
- `experienceYears` - Years of practice
- `licenseNumber` - Medical license
- `hospitalName` - Current institution
- `documents` - Array of verification document URLs

## API Response Example

### Success Response
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "doctor_id",
    "user": {
      "fullName": "Dr. John Doe",
      "email": "john@hospital.com",
      "contact": "+1-555-000-0000",
      "role": "doctor"
    },
    "fullName": "Dr. John Doe",
    "email": "john@hospital.com",
    "contact": "+1-555-000-0000",
    "specialization": "Cardiology",
    "qualification": "MD, Cardiology Fellowship",
    "experienceYears": 10,
    "licenseNumber": "MED-123456-2024",
    "hospitalName": "City Hospital",
    "image": "data:image/jpeg;base64,...",
    "documents": ["https://example.com/doc1", "https://example.com/doc2"]
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

## Error Handling

The component includes:
- Try-catch blocks for API calls
- Validation error messages
- Toast notifications for success/failure
- Fallback image display with initials
- Automatic navigation to profile on success

## Testing the Feature

### Manual Testing Steps:
1. Login as a doctor
2. Go to `/doctor/profile`
3. Click "Edit Profile"
4. Change at least one field
5. Optionally upload a new profile picture
6. Click "Save Changes"
7. Verify data is updated in database
8. Check if changes appear on profile page

### Test Cases:
- ✅ Edit without changing image
- ✅ Upload new profile picture
- ✅ Update required fields
- ✅ Update optional fields
- ✅ Test validation with invalid email
- ✅ Test file size validation (upload file > 5MB)
- ✅ Cancel edit and verify no changes
- ✅ Verify form pre-fills with current data

## Future Enhancements

1. **Image Storage**
   - Integrate Cloudinary for cloud storage
   - Add image compression before upload
   - Support multiple image formats

2. **Additional Features**
   - Add availability scheduling
   - Add consultation fees
   - Add bio/about section
   - Add social media links
   - Add clinic photos gallery

3. **UI Improvements**
   - Add image cropping tool
   - Add drag-and-drop file upload
   - Add section-based editing (edit one section at a time)
   - Add change history/audit trail

4. **Validation Enhancements**
   - Phone number format validation by country
   - License number format validation
   - Real-time field validation with debouncing
   - Check for duplicate license numbers

## Troubleshooting

### Issue: Profile not updating
**Solution**: Check console for errors, verify authentication token is valid

### Issue: Image not showing after upload
**Solution**: Image is stored as base64, check browser console for any CORS errors

### Issue: Form shows old data
**Solution**: The component fetches fresh data on load, clear browser cache if needed

### Issue: Edit button not working
**Solution**: Verify doctor role in authentication token, check user is logged in

## Files Modified/Created

### Created Files:
- `frontend/src/pages/doctor/DoctorEditProfile.jsx`

### Modified Files:
- `server/routes/Doctor.js` - Added PUT /profile/update endpoint
- `frontend/src/services/doctorApi.js` - Added updateDoctorProfile() function
- `frontend/src/routes/DoctorRoutes.jsx` - Added /edit-profile route
- `frontend/src/pages/doctor/DoctorProfile.jsx` - Added navigation to edit page

## Dependencies Used
- React Hooks (useState, useEffect, useRef)
- React Router (useNavigate)
- react-toastify (notifications)
- Tailwind CSS (styling)
- Mongoose (backend validation)

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Role-based Access**: Only doctors can edit their own profile
3. **Data Validation**: Both client and server-side validation
4. **File Upload**: File type and size validation
5. **No Sensitive Data**: Email changes don't affect authentication

## Next Steps

1. Test the feature thoroughly
2. Get user feedback on UX
3. Consider image hosting solution
4. Add additional fields as needed
5. Implement change history/versioning if required
