import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { clearFhirError } from '../../slices/fhirSlice';

/**
 * FHIR Error Toast Component
 * Globally displays FHIR API errors with user-friendly messages
 * Automatically dismissed after 5 seconds
 * Mount once in root App.js
 */
const FhirErrorToast = () => {
  const dispatch = useDispatch();
  const { fhirError } = useSelector(state => state.fhir);

  // Mapping of error codes to user-friendly messages
  const errorMessages = {
    403: 'Access Denied: You do not have permission to access this resource.',
    404: 'Resource Not Found: The requested medical record is not available.',
    422: 'Validation Error: The data provided is invalid or incomplete.',
    429: 'Too Many Requests: Please wait before trying again.',
    500: 'Server Error: An unexpected error occurred. Please contact support.',
    'CONSENT_REQUIRED': 'Consent Required: You must provide consent to access this resource.',
    'INVALID_RESOURCE': 'Invalid Resource: The medical record format is not recognized.',
    'NETWORK_ERROR': 'Network Error: Unable to connect to the server.',
    'TOKEN_EXPIRED': 'Session Expired: Please log in again.',
    'ENCRYPTION_ERROR': 'Security Error: Unable to process encrypted data. Please try again.'
  };

  useEffect(() => {
    if (fhirError) {
      // Get user-friendly message based on error code or message
      const displayMessage = errorMessages[fhirError.code] || 
                            errorMessages[fhirError.message] || 
                            fhirError.message || 
                            'An error occurred. Please try again.';

      // Show toast notification
      toast.error(displayMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear error from Redux store after showing
      setTimeout(() => {
        dispatch(clearFhirError());
      }, 100);
    }
  }, [fhirError, dispatch]);

  // Component doesn't render anything visible
  // It only handles toast notifications
  return null;
};

export default FhirErrorToast;
