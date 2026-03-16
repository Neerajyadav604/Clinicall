/**
 * Test script to debug consent requests issue
 * Run from: cd server && node ../test-consent-requests.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ConsentRequest = require('../server/models/ConsentRequest');
const User = require('../server/models/User');

async function testConsentRequests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Test 1: Find all consent requests
    console.log('\n📊 TEST 1: All ConsentRequests in database');
    const allRequests = await ConsentRequest.find({})
      .populate('doctor_ref', 'fullName email')
      .populate('patient_ref', 'fullName email');
    
    console.log(`Found ${allRequests.length} total consent requests`);
    if (allRequests.length > 0) {
      console.log('\nFirst 3 requests:');
      allRequests.slice(0, 3).forEach((req, i) => {
        console.log(`\n  Request ${i + 1}:`);
        console.log(`    ID: ${req._id}`);
        console.log(`    Doctor: ${req.doctor_ref?.fullName} (${req.doctor_ref?._id})`);
        console.log(`    Patient: ${req.patient_ref?.fullName} (${req.patient_ref?._id})`);
        console.log(`    Patient Ref Type: ${typeof req.patient_ref._id}`);
        console.log(`    Status: ${req.status}`);
        console.log(`    Created: ${req.createdAt}`);
        console.log(`    ResourceTypes: ${req.resourceTypes.join(', ')}`);
      });
    }

    // Test 2: Find all users and their roles
    console.log('\n\n👥 TEST 2: All Users (first 5)');
    const users = await User.find({}).limit(5);
    users.forEach(user => {
      console.log(`  ${user.fullName} | ID: ${user._id} | Role: ${user.role}`);
    });

    // Test 3: Try to find pending requests by status
    console.log('\n\n⏳ TEST 3: All PENDING requests');
    const pendingRequests = await ConsentRequest.find({ status: 'pending' })
      .populate('doctor_ref', 'fullName')
      .populate('patient_ref', 'fullName');
    console.log(`Found ${pendingRequests.length} pending requests`);

    // Test 4: If we have at least one request, test querying by patient
    if (allRequests.length > 0) {
      const testRequest = allRequests[0];
      const patientId = testRequest.patient_ref._id;
      
      console.log(`\n\n🔍 TEST 4: Query for patient ${patientId}`);
      const queryResult = await ConsentRequest.find({ patient_ref: patientId, status: 'pending' })
        .populate('doctor_ref', 'fullName');
      console.log(`Found ${queryResult.length} pending requests for this patient`);
      if (queryResult.length > 0) {
        console.log('✅ Query successful - data should be visible to patient');
      } else {
        console.log('❌ Query returned 0 results - check patient_ref field');
      }
    }

    // Test 5: Check for any recent requests (last 24 hours)
    console.log('\n\n🕐 TEST 5: Requests from last 24 hours');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = await ConsentRequest.find({
      createdAt: { $gte: oneDayAgo }
    }).populate('doctor_ref', 'fullName').populate('patient_ref', 'fullName');
    console.log(`Found ${recentRequests.length} requests in last 24 hours`);
    recentRequests.forEach(req => {
      console.log(`  - From Dr. ${req.doctor_ref?.fullName} to ${req.patient_ref?.fullName} (${req.status})`);
    });

    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testConsentRequests();
