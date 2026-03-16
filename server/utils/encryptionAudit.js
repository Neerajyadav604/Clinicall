/**
 * Encryption Audit Utility — One-Time Script
 * Scans all Mongoose models for unencrypted PHI fields
 * Usage: node server/utils/encryptionAudit.js
 * Output: server/logs/encryption-audit.log
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// PHI field patterns to detect
const PHI_PATTERNS = [
  'name', 'fullname', 'firstname', 'lastname',
  'address', 'city', 'state', 'zip', 'postal',
  'dob', 'birthdate', 'dateofbirth',
  'phone', 'contact', 'mobile', 'email',
  'diagnosis', 'condition', 'procedure', 'medication',
  'allergy', 'intolerance',
  'insurance', 'policy',
  'license', 'credential',
  'note', 'notes', 'comment', 'comments',
  'reason', 'description',
  'ssn', 'social', 'mrn', 'medical_record',
  'gender', 'sex',
  'bloodgroup', 'blood_type',
  'emergencycontact', 'emergency_contact',
  'prescription', 'dosage'
];

/**
 * Check if a field name looks like PHI
 */
function isPHIField(fieldName) {
  const lowerName = fieldName.toLowerCase().replace(/[_-]/g, '');
  return PHI_PATTERNS.some(pattern => lowerName.includes(pattern.replace(/[_-]/g, '')));
}

/**
 * Extract encryption fields from a schema
 */
function getEncryptedFields(schema) {
  const encrypted = new Set();
  
  // Check if schema has any plugins with encryption
  if (schema._plugins) {
    schema._plugins.forEach(plugin => {
      // Check for fieldEncryption plugin
      if (plugin[0]) {
        const pluginObj = plugin[0];
        if (pluginObj._fieldEncryption || pluginObj.fields) {
          const fields = pluginObj.fields || [];
          fields.forEach(f => encrypted.add(f));
        }
      }
    });
  }
  
  // Alternative: parse schema directly
  const paths = schema.paths || {};
  Object.entries(paths).forEach(([path, schemaType]) => {
    if (schemaType && schemaType.options && schemaType.options._secret) {
      encrypted.add(path);
    }
  });
  
  return encrypted;
}

/**
 * Scan schema for unencrypted PHI fields
 */
function scanSchema(modelName, schema) {
  const result = {
    modelName,
    totalStringFields: 0,
    encryptedFields: [],
    unencryptedStringFields: [],
    potentialPHIUnencrypted: []
  };

  const encryptedFields = getEncryptedFields(schema);
  const paths = schema.paths || {};

  Object.entries(paths).forEach(([fieldPath, schemaType]) => {
    // Skip internal fields
    if (fieldPath.startsWith('_')) return;
    
    // Check if it's a string field
    const isString = schemaType.instance === 'String' || (schemaType.schema && schemaType.schema.type === String);
    
    if (isString) {
      result.totalStringFields++;
      
      if (encryptedFields.has(fieldPath)) {
        result.encryptedFields.push(fieldPath);
      } else {
        result.unencryptedStringFields.push(fieldPath);
        
        // Flag if looks like PHI
        if (isPHIField(fieldPath)) {
          result.potentialPHIUnencrypted.push({
            field: fieldPath,
            reason: `Field name matches PHI pattern`
          });
        }
      }
    }
  });

  return result;
}

/**
 * Main audit function
 */
async function runAudit() {
  try {
    // Load all models
    const modelsDir = path.join(__dirname, '../models');
    const modelFiles = fs.readdirSync(modelsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js');

    const results = [];
    let totalIssues = 0;

    console.log('🔍 Scanning models for unencrypted PHI...\n');

    for (const file of modelFiles.sort()) {
      try {
        // Clear require cache to reload fresh
        delete require.cache[require.resolve(path.join(modelsDir, file))];
        const model = require(path.join(modelsDir, file));
        
        if (model && model.schema) {
          const audit = scanSchema(model.modelName || file.replace('.js', ''), model.schema);
          results.push(audit);
          
          if (audit.potentialPHIUnencrypted.length > 0) {
            totalIssues += audit.potentialPHIUnencrypted.length;
          }
        }
      } catch (err) {
        console.error(`Error scanning ${file}:`, err.message);
      }
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      totalModels: results.length,
      modelsWithIssues: results.filter(r => r.potentialPHIUnencrypted.length > 0).length,
      totalIssuesFound: totalIssues,
      details: results
    };

    // Write to log file
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, 'encryption-audit.log');
    fs.writeFileSync(logFile, JSON.stringify(report, null, 2));

    // Console output
    console.log(`✅ Audit complete: ${totalIssues} potential issues found\n`);
    console.log('Models with unencrypted PHI:');
    
    results.forEach(audit => {
      if (audit.potentialPHIUnencrypted.length > 0) {
        console.log(`\n📋 ${audit.modelName} (${audit.totalStringFields} string fields)`);
        console.log(`   Encrypted: ${audit.encryptedFields.length}`);
        console.log(`   ⚠️  Unencrypted PHI fields:`);
        audit.potentialPHIUnencrypted.forEach(issue => {
          console.log(`      - ${issue.field}`);
        });
      }
    });

    console.log(`\n📄 Full report written to: ${logFile}`);
    process.exit(0);

  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

// Run audit
runAudit();
