import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: localStorage.getItem("token")
    ? (localStorage.getItem("token"))
    : null,
  loading: false, 
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
     setSignupData(state, value) {
      state.signupData = value.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const {setSignupData, setToken, setLoading } = authSlice.actions;
export default authSlice.reducer;
