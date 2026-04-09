class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper to generate FHIR OperationOutcome
const toFhirOperationOutcome = (statusCode, message, diagnostics = null) => {
  const severity = statusCode >= 500 ? 'fatal' : statusCode >= 400 ? 'error' : 'warning';
  return {
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity,
        code: statusCode === 404 ? 'not-found' : statusCode === 401 ? 'forbidden' : 'processing',
        details: { text: message },
        ...(diagnostics && { diagnostics })
      }
    ]
  };
};

// Error handling middleware function
const errorMiddleware = (err, req, res, next) => {
  // Check if this is a FHIR request
  const isFhirRequest = req.path.includes('/fhir/');
  const statusCode = err.statusCode || 500;
  
  // Always log the error details
  console.error('\n' + '='.repeat(80));
  console.error('❌ ERROR MIDDLEWARE CAUGHT AN ERROR');
  console.error('='.repeat(80));
  console.error('Error Type:', err.constructor.name);
  console.error('Error Message:', err.message);
  console.error('Status Code:', statusCode);
  console.error('Is Operational:', err.isOperational);
  console.error('Request Path:', req.path);
  console.error('Request Method:', req.method);
  if (err.stack) {
    console.error('Stack Trace:', err.stack);
  }
  console.error('='.repeat(80) + '\n');
  
  if (err.isOperational) {
    if (isFhirRequest) {
      res.status(statusCode).json(toFhirOperationOutcome(statusCode, err.message));
    } else {
      res.status(statusCode).json({ success: false, message: err.message });
    }
  } else {
    // Include error details in development environment
    const errorResponse = { 
      success: false, 
      message: 'An unexpected error occurred.',
    };
    
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error_details = err.message;
      errorResponse.error_type = err.constructor.name;
    }
    
    if (isFhirRequest) {
      res.status(500).json(toFhirOperationOutcome(500, 'An unexpected error occurred.', err.message));
    } else {
      res.status(500).json(errorResponse);
    }
  }
};

// Export all items
module.exports = errorMiddleware;
module.exports.AppError = AppError;
module.exports.toFhirOperationOutcome = toFhirOperationOutcome;