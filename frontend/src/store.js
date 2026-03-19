import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/ProfileSlice";
import notificationReducer from "./slices/notificationSlice";
import fhirReducer from "./slices/fhirSlice";
import mlReducer from "./slices/mlSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    notifications: notificationReducer,
    fhir: fhirReducer,
    ml: mlReducer,
  },
});
