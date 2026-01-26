#!/bin/bash

# Admin Panel Backend Testing Script
# This script helps test all admin endpoints

BASE_URL="http://localhost:4000/api/v1/admin"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzY1NmEwNjNhMmE5MzUwYmY0ZDJlNSIsImVtYWlsIjoidG1xeGFzaXF3cHpjeHN4aW15QHhmYXZhai5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjkzNjM1ODMsImV4cCI6MTc2OTQ0OTk4M30.7a2f4CzSviQG-dybnCFRk24oHQwpgt0YJDTOh3bF9GA"

echo "Admin Panel API Testing Script"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Dashboard Stats
echo -e "${BLUE}=== DASHBOARD STATS ===${NC}"

echo -e "${GREEN}1. Get Doctors Count${NC}"
curl -X GET "$BASE_URL/doctors/count" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

echo -e "${GREEN}2. Get Pending Registrations Count${NC}"
curl -X GET "$BASE_URL/registrations/pending/count" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

echo -e "${GREEN}3. Get Appointments Count${NC}"
curl -X GET "$BASE_URL/appointments/count" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

# Doctor Registrations
echo -e "${BLUE}=== DOCTOR REGISTRATIONS ===${NC}"

echo -e "${GREEN}4. Get Pending Registrations${NC}"
curl -X GET "$BASE_URL/registrations?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

# Appointments
echo -e "${BLUE}=== APPOINTMENTS ===${NC}"

echo -e "${GREEN}5. Get All Appointments${NC}"
curl -X GET "$BASE_URL/appointments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

echo -e "${GREEN}6. Get Pending Appointments${NC}"
curl -X GET "$BASE_URL/appointments?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

# Users
echo -e "${BLUE}=== USERS ===${NC}"

echo -e "${GREEN}7. Get All Users${NC}"
curl -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

# Doctors
echo -e "${BLUE}=== DOCTORS ===${NC}"

echo -e "${GREEN}8. Get Approved Doctors${NC}"
curl -X GET "$BASE_URL/doctors/approved" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

echo -e "${GREEN}9. Get Rejected Doctors${NC}"
curl -X GET "$BASE_URL/doctors/rejected" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
echo ""

echo -e "${BLUE}=== USAGE NOTES ===${NC}"
echo "1. Replace 'your_admin_token_here' with actual JWT token"
echo "2. Update BASE_URL if server runs on different port"
echo "3. Replace REGISTRATION_ID and APPOINTMENT_ID with actual IDs"
echo "4. For approve/reject operations, use PUT requests with body"
echo ""

# Example: Approve Registration
echo -e "${BLUE}=== EXAMPLE: APPROVE REGISTRATION ===${NC}"
echo "curl -X PUT \"$BASE_URL/registrations/REGISTRATION_ID/approve\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"adminRemarks\": \"Documents verified\"}'"
echo ""

# Example: Reject Appointment
echo -e "${BLUE}=== EXAMPLE: REJECT APPOINTMENT ===${NC}"
echo "curl -X PUT \"$BASE_URL/appointments/APPOINTMENT_ID/reject\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"reason\": \"Doctor not available\"}'"
echo ""

echo "Done!"
