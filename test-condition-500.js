/**
 * Test script to diagnose the GET /Condition 500 error
 * Run with: cd server && node ../test-condition-500.js
 */

process.chdir(__dirname);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

const mongoose = require('mongoose');

const Condition = require('./server/models/Condition');
const AuditEvent = require('./server/models/AuditEvent');
const User = require('./server/models/User');
const Appointment = require('./server/models/Appointment');

async function diagnoseIssue() {
  try {
    console.log('🔍 Starting diagnosis...');
    
    // Step 1: Connect to DB
    console.log('\n✅ [STEP 1] Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASEURL, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    
    // Step 2: Check Condition schema
    console.log('\n✅ [STEP 2] Checking Condition model...');
    const conditionDoc = await Condition.findOne({});
    if (conditionDoc) {
      console.log('  ✓ Found sample condition:', conditionDoc._id);
      console.log('  ✓ Has appointmentId:', !!conditionDoc.appointmentId);
    } else {
      console.log('  ⚠️  No conditions in database');
    }
    
    // Step 3: Check if we can create an AuditEvent
    console.log('\n✅ [STEP 3] Testing AuditEvent creation...');
    try {
      const auditEvent = new AuditEvent({
        action: 'R',  // This is what mapActionToAuditEventCode returns for 'SEARCH'
        recorded: new Date(),
        outcome: '0',
        outcomeDesc: 'Test success',
        agent: [{
          name: 'test-user',
          requestor: true,
          network: {
            address: '127.0.0.1',
            type: 'IPv4'
          }
        }],
      });
      
      await auditEvent.save();
      console.log('  ✓ AuditEvent saved successfully:', auditEvent._id);
      await AuditEvent.deleteOne({ _id: auditEvent._id });
      console.log('  ✓ Cleaned up test AuditEvent');
    } catch (auditErr) {
      console.error('  ❌ AuditEvent save failed:', auditErr.message);
      if (auditErr.errors) {
        Object.entries(auditErr.errors).forEach(([field, error]) => {
          console.error(`    Field: ${field} - ${error.message}`);
        });
      }
    }
    
    // Step 4: Test Condition query
    console.log('\n✅ [STEP 4] Testing Condition query...');
    try {
      const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      const testAppointmentId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
      
      const filter = { 
        userId: testUserId, 
        clinicalStatus: { $ne: 'resolved' }
      };
      filter.appointmentId = testAppointmentId;
      
      const results = await Condition.find(filter);
      console.log(`  ✓ Query executed (found ${results.length} conditions)`);
    } catch (queryErr) {
      console.error('  ❌ Query failed:', queryErr.message);
    }
    
    console.log('\n✅ Diagnosis complete!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

diagnoseIssue();
