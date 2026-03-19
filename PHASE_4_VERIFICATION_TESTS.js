/**
 * PHASE 4 Verification Tests - Drug Interaction Checker
 *
 * Tests 1-10 for comprehensive verification of:
 * - ML service (FastAPI) drug interaction checking
 * - Node.js backend integration
 * - Brand name normalization
 * - Severity ranking
 * - Edge cases and error handling
 */

const http = require('http');

// Configuration
const ML_SERVICE = {
  host: '127.0.0.1',
  port: 8000
};

const NODE_SERVICE = {
  host: '127.0.0.1',
  port: 4000
};

// Test results tracker
let testsPassed = 0;
let testsFailed = 0;
const results = [];

/**
 * Helper: Make HTTP/HTTPS request
 */
function makeRequest(host, port, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test logger
 */
function logTest(testNum, name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`\n[Test ${testNum}] ${status}: ${name}`);
  if (details) console.log(`  ${details}`);

  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
  }

  results.push({
    test: testNum,
    name,
    passed,
    details
  });
}

/**
 * Test Suite
 */
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 4 VERIFICATION TEST SUITE - Drug Interaction Checker');
  console.log('='.repeat(80));

  try {
    // === Test 1: ML Service Health Check ===
    console.log('\n--- Test 1: ML Service Health Check ---');
    try {
      const health = await makeRequest(ML_SERVICE.host, ML_SERVICE.port, 'GET', '/health');
      const hasMetadata = health.body.drug_interactions_loaded !== undefined;
      const hasCount = health.body.total_drug_interactions !== undefined;

      logTest(1,
        'ML service health endpoint returns drug DB metadata',
        health.status === 200 && hasMetadata && hasCount,
        `Status: ${health.status}, drug_interactions_loaded: ${health.body.drug_interactions_loaded}, total: ${health.body.total_drug_interactions}`
      );
    } catch (err) {
      logTest(1, 'ML service health endpoint returns drug DB metadata', false, `Error: ${err.message}`);
    }

    // === Test 2: Drug Interactions Database Load ===
    console.log('\n--- Test 2: Drug Interactions Database Load ---');
    try {
      const health = await makeRequest(ML_SERVICE.host, ML_SERVICE.port, 'GET', '/health');
      const hasCount = health.body.total_drug_interactions;
      const passed = hasCount && hasCount >= 60;

      logTest(2,
        'Drug interactions database loaded with >= 60 pairs',
        passed,
        `Total interactions loaded: ${hasCount || 'N/A'}`
      );
    } catch (err) {
      logTest(2, 'Drug interactions database loaded with >= 60 pairs', false, `Error: ${err.message}`);
    }

    // === Test 3: HIGH Severity Interaction - Warfarin + Aspirin ===
    console.log('\n--- Test 3: HIGH Severity Interaction (Warfarin + Aspirin) ---');
    try {
      const result = await makeRequest(
        ML_SERVICE.host,
        ML_SERVICE.port,
        'POST',
        '/ml/drugs/interactions',
        {
          medications: ['Warfarin', 'Aspirin'],
          allergies: []
        }
      );

      const hasInteractions = result.body.interactions && result.body.interactions.length > 0;
      const foundWarfarinAspirin = hasInteractions && result.body.interactions.some(i =>
        (i.drug1.toLowerCase().includes('warfarin') && i.drug2.toLowerCase().includes('aspirin')) ||
        (i.drug1.toLowerCase().includes('aspirin') && i.drug2.toLowerCase().includes('warfarin'))
      );
      const severity = foundWarfarinAspirin ? result.body.interactions[0].severity : null;
      const isHigh = severity === 'HIGH';

      logTest(3,
        'HIGH severity interaction detected (Warfarin + Aspirin)',
        isHigh,
        `Found: ${foundWarfarinAspirin}, Severity: ${severity}, Total interactions: ${hasInteractions ? result.body.interactions.length : 0}`
      );
    } catch (err) {
      logTest(3, 'HIGH severity interaction detected (Warfarin + Aspirin)', false, `Error: ${err.message}`);
    }

    // === Test 4: CRITICAL Severity Interaction - SSRIs + MAOIs ===
    console.log('\n--- Test 4: CRITICAL Severity Interaction (SSRIs + MAOIs) ---');
    try {
      const result = await makeRequest(
        ML_SERVICE.host,
        ML_SERVICE.port,
        'POST',
        '/ml/drugs/interactions',
        {
          medications: ['Fluoxetine', 'Phenelzine'],
          allergies: []
        }
      );

      const hasInteractions = result.body.interactions && result.body.interactions.length > 0;
      const foundCritical = hasInteractions && result.body.interactions.some(i => i.severity === 'CRITICAL');
      const overallRisk = result.body.overall_risk;

      logTest(4,
        'CRITICAL severity interaction detected (SSRIs + MAOIs)',
        foundCritical && overallRisk === 'CRITICAL',
        `Found critical: ${foundCritical}, Overall risk: ${overallRisk}, Total interactions: ${hasInteractions ? result.body.interactions.length : 0}`
      );
    } catch (err) {
      logTest(4, 'CRITICAL severity interaction detected (SSRIs + MAOIs)', false, `Error: ${err.message}`);
    }

    // === Test 5: SAFE Result - No Interaction ===
    console.log('\n--- Test 5: SAFE Result (Paracetamol + Vitamin C) ---');
    try {
      const result = await makeRequest(
        ML_SERVICE.host,
        ML_SERVICE.port,
        'POST',
        '/ml/drugs/interactions',
        {
          medications: ['Paracetamol', 'Vitamin C'],
          allergies: []
        }
      );

      const hasNoInteractions = !result.body.interactions || result.body.interactions.length === 0;
      const isSafe = result.body.overall_risk === 'SAFE';

      logTest(5,
        'SAFE result for non-interacting drugs (Paracetamol + Vitamin C)',
        hasNoInteractions && isSafe,
        `Interactions: ${result.body.interactions ? result.body.interactions.length : 0}, Overall risk: ${result.body.overall_risk}`
      );
    } catch (err) {
      logTest(5, 'SAFE result for non-interacting drugs (Paracetamol + Vitamin C)', false, `Error: ${err.message}`);
    }

    // === Test 6: Edge Case - Empty Medications ===
    console.log('\n--- Test 6: Edge Case - No Medications ---');
    try {
      const result = await makeRequest(
        ML_SERVICE.host,
        ML_SERVICE.port,
        'POST',
        '/ml/drugs/interactions',
        {
          medications: [],
          allergies: []
        }
      );

      // Should return SAFE or empty result, status 200
      const isSafe = result.body.overall_risk === 'SAFE';
      const noInteractions = !result.body.interactions || result.body.interactions.length === 0;

      logTest(6,
        'Edge case handled: empty medications list returns SAFE',
        isSafe && noInteractions,
        `Overall risk: ${result.body.overall_risk}, Interactions: ${result.body.interactions ? result.body.interactions.length : 0}`
      );
    } catch (err) {
      logTest(6, 'Edge case handled: empty medications list returns SAFE', false, `Error: ${err.message}`);
    }

    // === Test 7: Brand Name Normalization - Brufen → Ibuprofen ===
    console.log('\n--- Test 7: Brand Name Normalization (Brufen → Ibuprofen) ---');
    try {
      const result = await makeRequest(
        ML_SERVICE.host,
        ML_SERVICE.port,
        'POST',
        '/ml/drugs/interactions',
        {
          medications: ['Brufen', 'Methotrexate'], // Brufen is ibuprofen, should interact with MTX
          allergies: []
        }
      );

      const hasInteractions = result.body.interactions && result.body.interactions.length > 0;
      const foundMTXIbuprofen = hasInteractions && result.body.interactions.some(i =>
        (i.drug1.toLowerCase().includes('ibuprofen') && i.drug2.toLowerCase().includes('methotrexate')) ||
        (i.drug1.toLowerCase().includes('methotrexate') && i.drug2.toLowerCase().includes('ibuprofen'))
      );

      logTest(7,
        'Brand name normalization: Brufen recognized as Ibuprofen',
        foundMTXIbuprofen,
        `Found interaction: ${foundMTXIbuprofen}, Total interactions: ${hasInteractions ? result.body.interactions.length : 0}`
      );
    } catch (err) {
      logTest(7, 'Brand name normalization: Brufen recognized as Ibuprofen', false, `Error: ${err.message}`);
    }

    // === Test 8: Database Reload Endpoint ===
    console.log('\n--- Test 8: Database Reload Endpoint ===');
    try {
      const result = await makeRequest(
        ML_SERVICE.host,
        ML_SERVICE.port,
        'POST',
        '/ml/drugs/reload-db',
        {}
      );

      const hasSuccess = result.body.success === true;
      const hasCount = result.body.total_interactions !== undefined;
      const countValid = result.body.total_interactions >= 60;

      logTest(8,
        'Database reload endpoint works and returns interaction count',
        hasSuccess && hasCount && countValid,
        `Success: ${result.body.success}, Total interactions reloaded: ${result.body.total_interactions}`
      );
    } catch (err) {
      logTest(8, 'Database reload endpoint works and returns interaction count', false, `Error: ${err.message}`);
    }

    // === Test 9: Node.js Route Without patientId (Route Registration Check) ===
    console.log('\n--- Test 9: Node.js Route Registration & Auth Check ---');
    try {
      const result = await makeRequest(
        NODE_SERVICE.host,
        NODE_SERVICE.port,
        'POST',
        '/api/v1/ai/drugs/check',
        {
          medications: ['Warfarin', 'Aspirin'],
          allergies: []
        }
      );

      // Route is registered if we get 401 (auth required) instead of 404 (not found)
      // Status 401 means route exists and is protected by authenticateUser middleware
      const routeRegistered = result.status !== 404;
      const authProtected = result.status === 401;
      const authMessage = result.body.message === 'No token provided. Please login.';

      logTest(9,
        'Node.js route /api/v1/ai/drugs/check is registered and protected by auth',
        routeRegistered && authProtected && authMessage,
        `Status: ${result.status} (401 = route exists + auth required), Message: "${result.body.message || 'N/A'}"`
      );
    } catch (err) {
      logTest(9, 'Node.js route /api/v1/ai/drugs/check is registered and protected by auth', false, `Error: ${err.message} (Connection refused = backend not running)`);
    }

    // === Test 10: Node.js Route Accepts Request Structure (Route Structure Check) ===
    console.log('\n--- Test 10: Node.js Route Request Structure Validation ---');
    try {
      // Make multiple requests to validate the route accepts both with and without patientId
      const result1 = await makeRequest(
        NODE_SERVICE.host,
        NODE_SERVICE.port,
        'POST',
        '/api/v1/ai/drugs/check',
        {
          medications: ['Paracetamol'],
          allergies: []
          // No patientId
        }
      );

      const result2 = await makeRequest(
        NODE_SERVICE.host,
        NODE_SERVICE.port,
        'POST',
        '/api/v1/ai/drugs/check',
        {
          medications: ['Paracetamol'],
          allergies: [],
          patientId: '507f1f77bcf86cd799439011'
        }
      );

      // Both should return 401 (auth required), not 400 (bad request)
      // This means the route accepts both request structures
      const acceptsWithoutPatientId = result1.status === 401;
      const acceptsWithPatientId = result2.status === 401;
      const bothValid = acceptsWithoutPatientId && acceptsWithPatientId;

      logTest(10,
        'Node.js route accepts both with and without patientId fields',
        bothValid,
        `Status without patientId: ${result1.status}, Status with patientId: ${result2.status} (both 401 = route accepts structure)`
      );
    } catch (err) {
      logTest(10, 'Node.js route accepts both with and without patientId fields', false, `Error: ${err.message} (Connection refused = backend not running)`);
    }

    // === Summary ===
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✓ Passed: ${testsPassed}`);
    console.log(`✗ Failed: ${testsFailed}`);
    console.log(`⊘ Total:  ${testsPassed + testsFailed}`);
    console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    // Detailed results
    console.log('\nDETAILED RESULTS:\n');
    results.forEach(r => {
      const icon = r.passed ? '✓' : '✗';
      console.log(`${icon} Test ${r.test}: ${r.name}`);
      if (r.details) console.log(`  → ${r.details}`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (err) {
    console.error('TEST SUITE ERROR:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  process.exit(testsFailed > 0 ? 1 : 0);
}).catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
