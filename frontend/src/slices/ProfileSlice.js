import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
    loading: false,
};

const profileSlice = createSlice({
    name: "profile",
    initialState: initialState,
    reducers: {
        setUser(state, action) {
            let userData = action.payload;
            
            if (userData) {
                // Normalize role data to ensure consistency
                if (!userData.roles && userData.role) {
                    userData.roles = [userData.role.toLowerCase()];
                } else if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map(r => 
                        typeof r === 'string' ? r.toLowerCase() : r
                    );
                }
                if (userData.role && typeof userData.role === 'string') {
                    userData.role = userData.role.toLowerCase();
                }
                
                console.log("ProfileSlice - Setting user with normalized roles:", userData);
            }
            
            state.user = userData;
            if (userData) {
                localStorage.setItem("user", JSON.stringify(userData));
            } else {
                localStorage.removeItem("user"); // ✅ clean up on logout
            }
        },
        setLoading(state, value) {
            state.loading = value.payload;
        },
    },
});

export const { setUser, setLoading } = profileSlice.actions;
export default profileSlice.reducer;