/**
 * Production Environment Configuration
 * Validates all required environment variables on server startup
 * Crashes with clear error if any are missing
 */

const requiredEnvVars = [
  'DATABASEURL',
  'JWT_SECRET',
  'CLOUD_NAME',
  'CLOUD_API_KEY',
  'CLOUD_API_SECRET',
  'FHIR_SERVER_URL',
  'FHIR_CLIENT_ID',
  'FHIR_CLIENT_SECRET',
  'FHIR_REDIRECT_URI',
  'MAIL_USER',
  'MAIL_PASS',
  'ENCRYPTION_KEY',
  'FIELD_ENC_KEY'
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required env var is missing
 */
function validateEnvironment() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════╗
║ CRITICAL: Missing Required Environment Variables          ║
╠════════════════════════════════════════════════════════════╣
║ The following required environment variables are missing:  ║
║                                                            ║
${missing.map(v => `║   • ${v}`).join('\n')}
║                                                            ║
║ Server cannot start without these variables configured.    ║
║ Please add them to your .env file.                        ║
╚════════════════════════════════════════════════════════════╝
    `;
    console.error(errorMessage);
    process.exit(1);
  }

  // Warn if JWT_SECRET or ENCRYPTION_KEY are too short
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is too short (minimum 32 characters)');
  }
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    console.warn('⚠️  WARNING: ENCRYPTION_KEY is too short (minimum 32 characters)');
  }
}

/**
 * Get production configuration object
 * Used throughout the app instead of direct process.env access
 */
function getProductionConfig() {
  validateEnvironment();

  return {
    // Server
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'production',
    isProduction: (process.env.NODE_ENV || 'production') === 'production',

    // Database
    mongodb: {
      uri: process.env.DATABASEURL,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true
      }
    },

    // Authentication
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
      refreshExpiresIn: '30d'
    },

    // Encryption
    encryption: {
      key: process.env.ENCRYPTION_KEY,
      fieldKey: process.env.FIELD_ENC_KEY,
      algorithm: 'aes-256-gcm'
    },

    // Cloudinary
    cloudinary: {
      cloudName: process.env.CLOUD_NAME,
      apiKey: process.env.CLOUD_API_KEY,
      apiSecret: process.env.CLOUD_API_SECRET,
      uploadFolder: 'clinicall'
    },

    // FHIR / OAuth2
    fhir: {
      serverUrl: process.env.FHIR_SERVER_URL,
      clientId: process.env.FHIR_CLIENT_ID,
      clientSecret: process.env.FHIR_CLIENT_SECRET,
      redirectUri: process.env.FHIR_REDIRECT_URI,
      scopes: process.env.FHIR_SCOPES || 'launch/patient openid fhirUser patient/*.read patient/*.write'
    },

    // Email
    email: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 587
    },

    // Razorpay
    razorpay: {
      keyId: process.env.RAZORPAY_KEY,
      keySecret: process.env.RAZORPAY_SECRET
    },

    // Feature Flags
    features: {
      helmetEnabled: true,
      rateLimitingEnabled: true,
      breachDetectionEnabled: true,
      dataIntegrityChecksEnabled: true,
      consoleLongEnabled: process.env.NODE_ENV !== 'production'
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      maxDays: 30
    },

    // Security
    security: {
      cors: {
        origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
        credentials: true
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    }
  };
}

/**
 * Get environment-specific config
 * Returns production config in production mode, development defaults otherwise
 */
function getConfig() {
  if (process.env.NODE_ENV === 'production') {
    return getProductionConfig();
  }

  // Development config (less strict)
  return {
    port: process.env.PORT || 5000,
    nodeEnv: 'development',
    isProduction: false,
    mongodb: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/clinicall-dev'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      expiresIn: '7d'
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long',
      fieldKey: process.env.FIELD_ENC_KEY || 'dev-field-enc-key-32-chars'
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    fhir: {
      serverUrl: process.env.FHIR_SERVER_URL || 'https://launch.smarthealthit.org/v/r4/fhir',
      clientId: process.env.FHIR_CLIENT_ID,
      clientSecret: process.env.FHIR_CLIENT_SECRET,
      redirectUri: process.env.FHIR_REDIRECT_URI || 'http://localhost:5000/auth/fhir/callback'
    },
    email: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    features: {
      helmetEnabled: true,
      rateLimitingEnabled: true,
      breachDetectionEnabled: true,
      dataIntegrityChecksEnabled: true,
      consoleLogEnabled: true
    },
    logging: {
      level: 'debug',
      maxDays: 7
    }
  };
}

module.exports = {
  validateEnvironment,
  getProductionConfig,
  getConfig
};
