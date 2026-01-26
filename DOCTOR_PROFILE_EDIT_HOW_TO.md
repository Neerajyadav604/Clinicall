# Doctor Edit Profile - Step-by-Step Usage Guide

## 🎯 Quick Start for Doctors

### Step 1: Access Your Profile
1. Login to the application with doctor credentials
2. Navigate to the Doctor Dashboard
3. Click on **"My Profile"** in the sidebar

### Step 2: Go to Edit Mode
1. On the Profile page, click the blue **"Edit Profile"** button (top right)
2. You'll be taken to the Edit Profile page
3. All your current information will be pre-filled in the form

### Step 3: Update Profile Picture (Optional)
1. Look for your profile picture in the center
2. Click the **camera icon** (blue circle at bottom-right of photo)
3. A file browser will open
4. Select a new image (JPG, PNG, GIF, or WebP)
5. The image preview will update immediately
6. File must be less than 5MB

### Step 4: Update Information
Fill in or modify any of these fields:

#### Required Fields (must be filled):
- **Full Name**: Your complete name
- **Email**: Your email address (must be valid format)
- **Phone Number**: Your contact number
- **Specialization**: Your medical specialty (e.g., Cardiology, Neurology)
- **Medical License Number**: Your medical license number

#### Optional Fields (can be left blank):
- **Educational Qualification**: Your degrees and certifications
- **Years of Experience**: How many years of practice
- **Hospital/Clinic Name**: Your current workplace
- **Verification Documents**: Links to your credentials (one per line)

### Step 5: Save Changes
1. Review all the information you've entered
2. Click the **"Save Changes"** button (bottom right)
3. A loading indicator will show while saving
4. You'll see a success notification
5. You'll be automatically redirected to your profile page

### Step 6: Verify Updates
1. Check that all your information is correct
2. If image was uploaded, it should display in the profile picture area
3. All text fields should show your updated information

---

## 📸 Profile Picture Upload Tips

### Supported Formats
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ❌ PDF, Word, TXT (not supported)

### Image Requirements
- **Maximum Size**: 5MB
- **Recommended Size**: 200x200 pixels (square)
- **Format**: Clear, professional photo
- **Quality**: High resolution preferred

### Upload Process
1. Click the camera icon on your profile picture
2. Select image from your computer
3. Preview will show immediately
4. Image is stored when you click "Save Changes"

---

## ✅ Form Validation

The form will check your information and show errors if:

| Error | Reason | Fix |
|-------|--------|-----|
| "Full name is required" | Empty full name field | Enter your complete name |
| "Email is required" | Empty email field | Enter your email address |
| "Enter a valid email" | Invalid email format | Use format: example@domain.com |
| "Contact is required" | Empty phone field | Enter your phone number |
| "Specialization is required" | Empty specialty field | Enter your medical specialty |
| "License number is required" | Empty license field | Enter your license number |

---

## 🎨 What You Can Edit

### Personal Information
```
Full Name: Dr. John Doe ✏️
Email: john@hospital.com ✏️
Phone: +1-555-000-0000 ✏️
```

### Professional Details
```
Specialization: Cardiology ✏️
Qualification: MD, Cardiology Fellowship ✏️
Experience: 15 years ✏️
License Number: MED-123456-2024 ✏️
Hospital: City Medical Center ✏️
```

### Additional
```
Documents: [Links to credentials] ✏️
Profile Picture: [Can be changed] 📸
```

---

## 💾 Data Saving

### What Gets Saved
When you click "Save Changes":
- ✅ All form fields are saved to database
- ✅ Profile picture is stored (as base64 or URL)
- ✅ Changes are immediately visible on your profile
- ✅ Data persists even after logout/login

### Where Data is Stored
- **Database**: Doctor profile collection
- **Browser Cache**: localStorage for quick access
- **Image**: Stored as base64 in profile

---

## ⚠️ Important Information

### Before Saving
- Check spelling of all fields
- Verify email address is correct
- Ensure phone number is correct format
- Double-check license number

### After Saving
- Profile page will show updated information
- Changes are permanent
- You can edit again anytime
- Previous versions are not kept (no version history)

### Special Notes
- **Email changes**: Don't affect your login credentials
- **License Number**: Should be unique in system
- **Documents**: Can be multiple URLs, one per line
- **Image**: Old image is replaced with new one

---

## 🔄 Canceling Changes

### If You Don't Want to Save
1. Click the **"Cancel"** button (gray button, bottom left)
2. You'll return to your profile page
3. **No changes will be saved**
4. Your old information remains unchanged

---

## 🐛 Troubleshooting

### Issue: "Edit Profile" button not working
**Solution**: 
- Refresh the page
- Clear browser cache
- Verify you're logged in as a doctor

### Issue: Image upload fails
**Solution**:
- Check file format (must be JPG, PNG, GIF, or WebP)
- Check file size (must be less than 5MB)
- Try a different image
- Try uploading without image first

### Issue: "Save Changes" button not working
**Solution**:
- Check all required fields are filled (see red asterisks)
- Verify email format is correct
- Check for any error messages shown in red
- Try scrolling up to see if there are validation errors

### Issue: Form shows old data after refresh
**Solution**:
- This is normal - form fetches current data from server
- Wait for "Loading..." to complete
- Refresh page if data doesn't load

### Issue: Not redirected to profile after save
**Solution**:
- Check browser console for errors
- Verify server is running
- Try clicking profile link manually
- Refresh the page

---

## 📱 Mobile Usage

The edit profile form works great on mobile:
1. Portrait mode: Fields stack vertically
2. Landscape mode: Fields in 2 columns
3. Touch-friendly: Large buttons and inputs
4. Responsive image upload: Works on all devices

---

## 🔐 Security Notes

- ✅ Your data is encrypted in transit
- ✅ Only you can edit your profile
- ✅ Email changes don't affect security
- ✅ All changes are logged (on backend)
- ✅ Invalid input is rejected

---

## ⏱️ Expected Timeline

| Action | Time |
|--------|------|
| Load edit page | 1-2 seconds |
| Image upload | 1-3 seconds |
| Save changes | 2-5 seconds |
| Redirect to profile | ~1.5 seconds |
| **Total time** | **5-11 seconds** |

---

## 💡 Pro Tips

1. **Save frequently**: Save your changes as you make them
2. **Check preview**: Always verify image preview before saving
3. **Use format**: Enter phone number in standard format
4. **Document URLs**: Make sure document links are working
5. **Professional photo**: Use a clear, professional profile picture

---

## 🎯 Common Scenarios

### Scenario 1: Update phone number only
1. Click "Edit Profile"
2. Change only the Phone Number field
3. Leave everything else as is
4. Click "Save Changes"
5. Done! ✅

### Scenario 2: Change profile picture
1. Click "Edit Profile"
2. Click camera icon on profile picture
3. Select new image
4. Preview updates automatically
5. Click "Save Changes"
6. Scroll down to see new picture on profile ✅

### Scenario 3: Add experience years
1. Click "Edit Profile"
2. Scroll to "Years of Experience" field
3. Enter number (e.g., 15)
4. Click "Save Changes"
5. Verify on profile page ✅

### Scenario 4: Update multiple fields
1. Click "Edit Profile"
2. Update several fields
3. Check for any red error messages
4. Click "Save Changes"
5. All updates saved at once ✅

---

## 📞 Getting Help

If you encounter issues:
1. **Check error messages**: Red text explains what's wrong
2. **Verify required fields**: Fields with * are required
3. **Clear cache**: Browser cache might have old data
4. **Refresh page**: Sometimes helps with loading issues
5. **Contact support**: If problem persists

---

## 🎉 You're All Set!

You now know how to:
- ✅ Access your doctor profile
- ✅ Edit your information
- ✅ Change your profile picture
- ✅ Save changes securely
- ✅ Verify updates

**Start editing your profile now!**

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Status**: Ready to Use
