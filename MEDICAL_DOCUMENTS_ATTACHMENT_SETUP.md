# Medical Documents Attachment Feature Setup

## Overview
Doctor can now attach medical documents (X-rays, blood reports, etc.) to lab reports which patients can view and download from their medical records.

## Changes Made

### 1. **Frontend Updates**

#### DoctorConsultationPanel.js
- **Added State Variables:**
  - `attachmentFile` - Stores the selected file
  - `attachmentTitle` - Title/description of the attachment
  - `previewUrl` - Preview URL for image files

- **Added File Upload Handler (`handleFileSelect`):**
  - Validates file type (JPEG, PNG, PDF only)
  - Validates file size (max 10MB)
  - Shows image preview for supported formats
  - Displays user-friendly error messages

- **Updated `handleAddRecord` Function:**
  - Now uses `FormData` to handle file uploads
  - Sends multipart/form-data to backend
  - Includes attachment file and title for lab reports
  - Clears attachment state after successful submission

- **Added UI Components:**
  - File input field in Lab Report section
  - File preview with remove option
  - Document title input for custom naming
  - File type and size restrictions display

#### LabResultsViewer.jsx
- **Added Attachment Display Support:**
  - Checks for `report.attachmentUrl` first
  - Handles base64 encoded data (download button)
  - Handles URL references (view button)
  - Falls back to `report.presentedForm` for FHIR format
  - Shows "No Attachment" when neither exists

- **Fixed Undefined Value Handling:**
  - Safely handles missing `report.display`, `report.status`
  - Uses fallback values when fields are undefined

#### MedicalRecords.js
- **Updated Lab Report Transformation:**
  - Added `attachmentUrl` to report data
  - Added `title` field to report data
  - Passes attachment from consultation records to frontend

### 2. **Backend Updates**

#### server/routes/consultation.routes.js
- **Added Multer Configuration:**
  - Memory storage for file uploads
  - File filter for JPEG, PNG, PDF only
  - 10MB file size limit
  - Single file upload as `attachmentFile`

- **Updated Route Middleware:**
  - Added `upload.single("attachmentFile")` to the `/consultation/record/:sessionId` route
  - Doctor must be authenticated (`authenticateUser`, `isDoctor`)

#### server/Controllers/consultationController.js
- **Added File Processing Logic:**
  - Checks if file exists and recordType is "lab_report"
  - Converts file buffer to base64 for storage
  - Creates data URL with MIME type
  - Extracts attachment title from request or file name
  - Logs successful file attachment

- **Error Handling:**
  - Gracefully continues if file processing fails
  - Records created even if attachment processing errors

#### server/models/MedicalRecord.js
- No changes needed - `attachmentUrl` field already exists

#### server/package.json
- **Added Dependency:**
  - `"multer": "^1.4.5-lts.1"` - For handling file uploads

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Start Servers (if not already running)
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

## Usage Flow

### Doctor's Perspective
1. Start a consultation session
2. In "Add Medical Record" form, select "Lab Report"
3. Fill in:
   - Title (e.g., "Chest X-ray")
   - Test Name (e.g., "Chest Radiograph")
   - Result details
4. **NEW:** Click "Attach Document" and select file (JPEG, PNG, or PDF)
5. Enter a descriptive title for the attachment (e.g., "X-ray Chest")
6. View image preview (if applicable)
7. Submit form
8. Record saved with attachment

### Patient's Perspective
1. Navigate to Medical Records page
2. Scroll to "Lab Results & Reports" section
3. View the lab report card
4. Click "Download" or "View" button for the attachment
5. Image displays or file downloads depending on file type

## File Storage

### Current Implementation
Files are stored as base64-encoded data URLs in the MongoDB database:
```
attachmentUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
```

**Advantages:**
- No external storage needed
- Works offline
- Kept with record data

**For Production:**
Consider implementing cloud storage (AWS S3, Cloudinary) for:
- Better scalability
- Reduced DB size
- CDN delivery
- Easier management

## Supported File Types
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **PDF** (.pdf)

## Size Limitations
- **Maximum file size:** 10MB
- **Browser upload:** Client-side validation before sending
- **Server validation:** Additional server-side validation

## Error Handling

### Client-Side Errors
- **File too large:** "File size must be less than 10MB"
- **Wrong format:** "Only JPEG, PNG, or PDF files are allowed"
- **No file selected:** Optional field - can submit without

### Server-Side Errors
- Invalid MIME type rejection
- File processing errors logged but don't block record creation
- Graceful degradation - record created without attachment if file fails

## API Endpoint

**POST** `/api/v1/consultation/record/:sessionId`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
{
  recordType: "lab_report",
  title: "Chest X-ray",
  content: "X-ray shows no abnormalities",
  labTest: {
    testName: "Chest Radiograph",
    result: "Normal",
    unit: "N/A",
    referenceRange: "N/A",
    status: "normal"
  },
  attachmentFile: <File>,           // Optional, only for lab_report
  attachmentTitle: "X-ray Chest"   // Optional, only if attachmentFile present
}
```

## Database Schema

**MedicalRecord Collection:**
```javascript
{
  recordType: "lab_report",
  title: "Chest X-ray",
  labTest: { ... },
  attachmentUrl: "data:image/jpeg;base64,...",  // NEW
  createdAt: "2026-03-16T...",
  // ... other fields
}
```

## Testing Checklist

- [ ] Doctor can attach file to lab report
- [ ] File validation works (type and size)
- [ ] Image preview displays correctly
- [ ] Can remove and reselect file
- [ ] File uploads successfully with record
- [ ] Patient sees attachment in Medical Records
- [ ] Can view/download attachment
- [ ] Different file types work (JPEG, PNG, PDF)
- [ ] Large files rejected with error message
- [ ] Wrong file type rejected with error message
- [ ] Record created even if attachment fails (graceful degradation)

## Future Enhancements

1. **Cloud Storage Integration**
   - AWS S3 for file management
   - Cloudinary for image optimization
   - CDN delivery

2. **Multiple Attachments**
   - Allow multiple files per record
   - Gallery view for multiple images

3. **File Management**
   - Replace attachment option
   - Delete attachment option
   - Edit attachment title

4. **Advanced Features**
   - Automatic image compression
   - OCR for document scanning
   - Annotation tools
   - Signature verification

5. **Security**
   - Encryption for stored files
   - Audit logging for downloads
   - HIPAA compliance verification

## Troubleshooting

### "multer is not defined" error
- Run `npm install` in server directory
- Restart server after installation

### File upload fails silently
- Check Network tab in browser DevTools
- Check server logs for errors
- Verify file size < 10MB
- Verify file type is JPEG, PNG, or PDF

### Attachment doesn't display in Medical Records
- Refresh page to reload data
- Check console for errors
- Verify `attachmentUrl` exists in database record
- Check that file still accessible (base64 data intact)

### Image shows as broken/unloaded
- Base64 data may be corrupted
- Try re-uploading file
- Check file size before upload

## Notes

- Current implementation stores files as base64 in database
- This is suitable for development/testing
- Production should use external storage (AWS S3, Cloudinary, etc.)
- Attachment is **optional** for lab reports - records can be created without files
- Files stored as part of MedicalRecord document - no separate file collection needed
