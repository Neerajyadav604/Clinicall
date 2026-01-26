# Admin Panel Documentation

## Overview
A complete, production-ready Admin Panel for Doctor Appointment Management System built with React and Tailwind CSS.

## Features

### 1. Dashboard
- Overview statistics (Total Doctors, Pending Registrations, Appointments, etc.)
- Recent activities feed
- Quick stats display
- Responsive grid layout

### 2. Doctor Registrations Management
- View all doctor registration requests
- Filter by status (Pending, Approved, Rejected)
- Approve/Reject registrations with modals
- View doctor profile details
- Automatic email notifications on approval/rejection

### 3. Appointments Management
- List all appointments with details
- Filter by status (Pending, Approved, Cancelled)
- Approve/Cancel appointments
- Patient and doctor information display
- Date and time management

### 4. Users Management
- View all system users
- Display user roles (Patient, Doctor, Admin)
- User contact information
- Account creation dates

### 5. Approved Doctors
- View all verified and approved doctors
- Display professional credentials
- Hospital affiliations
- License numbers

### 6. Rejected Doctors
- View rejected applications
- Display rejection reasons
- Historical tracking

## Folder Structure

```
frontend/src/
├── pages/admin/
│   ├── AdminLayout.jsx              # Main layout wrapper
│   ├── AdminDashboard.jsx           # Dashboard page
│   ├── DoctorRegistrations.jsx      # Registration management
│   ├── Appointments.jsx             # Appointment management
│   ├── Users.jsx                    # Users management
│   ├── ApprovedDoctors.jsx          # Approved doctors list
│   └── RejectedDoctors.jsx          # Rejected doctors list
├── components/admin/
│   ├── Sidebar.jsx                  # Navigation sidebar
│   ├── Navbar.jsx                   # Top navigation bar
│   ├── StatCard.jsx                 # Statistic card component
│   ├── TableComponent.jsx           # Reusable table component
│   └── ActionModal.jsx              # Approve/Reject modal
└── routes/
    └── AdminRoutes.jsx              # Admin routes configuration
```

## Installation & Setup

### 1. Install Required Dependencies
```bash
npm install react-icons react-toastify
```

### 2. Add Routes to Main App
In your main `App.js`, add:
```javascript
import AdminRoutes from './routes/AdminRoutes';

// Inside your Routes component:
<Route path="/admin/*" element={<AdminRoutes />} />
```

### 3. Configure API Endpoints
Update the API endpoints in each page component:
- Replace `/api/v1/admin/...` with your actual backend endpoints
- Add authentication headers with admin token from localStorage

### 4. Set Up Environment Variables
```env
REACT_APP_BASE_URL=http://localhost:4000/api/v1
```

## API Integration

### Required Backend Endpoints

#### Dashboard Stats
- `GET /api/v1/admin/doctors/count` - Get total doctors count
- `GET /api/v1/admin/registrations/pending/count` - Get pending registrations
- `GET /api/v1/admin/appointments/count` - Get appointments count

#### Doctor Registrations
- `GET /api/v1/admin/registrations?status=PENDING` - Get registrations by status
- `PUT /api/v1/admin/registrations/:id/approve` - Approve registration
- `PUT /api/v1/admin/registrations/:id/reject` - Reject registration
- `POST /api/v1/admin/send-email` - Send notification emails

#### Appointments
- `GET /api/v1/admin/appointments` - Get all appointments
- `PUT /api/v1/admin/appointments/:id/approve` - Approve appointment
- `PUT /api/v1/admin/appointments/:id/reject` - Cancel appointment

#### Users
- `GET /api/v1/admin/users` - Get all users

#### Doctors
- `GET /api/v1/admin/doctors/approved` - Get approved doctors
- `GET /api/v1/admin/doctors/rejected` - Get rejected doctors

## Component Documentation

### AdminLayout
Main layout wrapper containing Sidebar and Navbar.
**Props:**
- `children` - Page content

### Sidebar
Navigation sidebar with menu items and icons.
**Props:**
- `isOpen` - Sidebar open state
- `setIsOpen` - Function to toggle sidebar

### Navbar
Top navigation bar with admin profile and logout.
**Props:**
- `onMenuClick` - Callback for menu button click

### TableComponent
Reusable table for displaying data with custom columns.
**Props:**
- `columns` - Array of column definitions
- `data` - Array of row data
- `loading` - Loading state

**Column Definition:**
```javascript
{
  key: 'fieldName',          // Data field key
  label: 'Display Name',     // Column header
  render: (value, row) => {} // Optional custom render function
}
```

### ActionModal
Modal for approve/reject operations with confirmation.
**Props:**
- `isOpen` - Modal open state
- `onClose` - Close callback
- `doctor` - Doctor data object
- `type` - 'view', 'approve', or 'reject'
- `onApprove` - Approve callback
- `onReject` - Reject callback

### StatCard
Card component for displaying statistics.
**Props:**
- `title` - Stat title
- `value` - Stat value
- `icon` - Icon component
- `color` - Color theme ('blue', 'yellow', 'green', 'purple', 'red')

## Authentication

Admin routes should be protected. Add authentication check in `AdminRoutes.jsx`:

```javascript
const ProtectedAdminRoute = ({ element }) => {
  const token = localStorage.getItem('adminToken');
  return token ? element : <Navigate to="/admin-login" />;
};
```

## Styling

All components use Tailwind CSS. Customize by modifying:
- Color schemes in color utility classes
- Responsive breakpoints (md:, lg:, etc.)
- Spacing and sizing utilities

## Best Practices Implemented

✅ Functional components with React Hooks
✅ State management with useState
✅ Side effects with useEffect
✅ Error handling and loading states
✅ Responsive design
✅ Reusable components
✅ Clean code structure
✅ Toast notifications for user feedback
✅ Dummy data for demo/testing
✅ Production-ready code

## Future Enhancements

- [ ] Pagination for large datasets
- [ ] Advanced filtering and search
- [ ] Bulk actions (approve multiple)
- [ ] Export data to CSV/Excel
- [ ] Email template customization
- [ ] Admin activity logs
- [ ] Role-based permissions
- [ ] Advanced analytics and reporting

## Troubleshooting

### No data appearing
- Check browser console for API errors
- Verify API endpoints are correct
- Check authentication token in localStorage
- Ensure CORS is configured on backend

### Sidebar not responding
- Check if localStorage is enabled
- Verify token is being stored correctly
- Check browser console for errors

### Modal not closing
- Ensure `onClose` callback is properly wired
- Check if form validation is blocking submission

## Support

For issues or questions, check:
1. Browser console for errors
2. Network tab for API responses
3. Component props and state values
4. API endpoint availability
