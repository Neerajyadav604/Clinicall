import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  symptomPredictions: [],
  recommendedDoctors: [],
  recordSummary: null,
  drugInteractions: null,
  selectedSymptoms: [],
  loading: {
    symptoms: false,
    doctors: false,
    summary: false,
    drugs: false,
  },
  error: {
    symptoms: null,
    doctors: null,
    summary: null,
    drugs: null,
  },
  mlServiceDown: false,
  lastChecked: {
    symptoms: null,
    summary: null,
    drugs: null,
  },
};

const mlSlice = createSlice({
  name: "ml",
  initialState,
  reducers: {
    setSymptomPredictions: (state, action) => {
      state.symptomPredictions = action.payload;
      state.lastChecked.symptoms = new Date().toISOString();
    },

    setRecommendedDoctors: (state, action) => {
      state.recommendedDoctors = action.payload;
    },

    setRecordSummary: (state, action) => {
      state.recordSummary = action.payload;
      state.lastChecked.summary = new Date().toISOString();
    },

    setDrugInteractions: (state, action) => {
      state.drugInteractions = action.payload;
      state.lastChecked.drugs = new Date().toISOString();
    },

    setSelectedSymptoms: (state, action) => {
      state.selectedSymptoms = action.payload;
    },

    setMlLoading: (state, action) => {
      state.loading = { ...state.loading, ...action.payload };
    },

    setMlError: (state, action) => {
      state.error = { ...state.error, ...action.payload };
    },

    setMlServiceDown: (state, action) => {
      state.mlServiceDown = action.payload;
    },

    clearMlState: () => {
      return initialState;
    },
  },
});

export const {
  setSymptomPredictions,
  setRecommendedDoctors,
  setRecordSummary,
  setDrugInteractions,
  setSelectedSymptoms,
  setMlLoading,
  setMlError,
  setMlServiceDown,
  clearMlState,
} = mlSlice.actions;

// Selectors
export const selectSymptomPredictions = (state) =>
  state.ml.symptomPredictions;

export const selectRecommendedDoctors = (state) =>
  state.ml.recommendedDoctors;

export const selectRecordSummary = (state) =>
  state.ml.recordSummary;

export const selectDrugInteractions = (state) =>
  state.ml.drugInteractions;

export const selectSelectedSymptoms = (state) =>
  state.ml.selectedSymptoms;

export const selectMlLoading = (state) =>
  state.ml.loading;

export const selectMlError = (state) =>
  state.ml.error;

export const selectMlServiceDown = (state) =>
  state.ml.mlServiceDown;

export const selectLastChecked = (state) =>
  state.ml.lastChecked;

export default mlSlice.reducer;
