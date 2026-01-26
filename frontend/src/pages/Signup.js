import React, { useState } from "react";
import doctorimg from "../assets/logindoctor.png";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSignupData } from "../slices/authSlice";
import { sendOtp } from "../services/operations/Authapi";
const SignUp = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formdata, setformdata] = useState({
        role: "",
        fullName: "",
        contact: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const {
        role,
        fullName,
        contact,
        email,
        password,
        confirmPassword,
    } = formdata;

    const handleonchange = (e) => {
        setformdata((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        dispatch( setSignupData( formdata ) );
        dispatch(sendOtp(formdata.email,navigate))

    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row mt-28">
            <div className="hidden lg:block lg:flex-1 bg-gray-100">
                <img
                    src={doctorimg}
                    alt="Doctor"
                    className="h-full w-full object-cover"
                />
            </div>

            <form
                onSubmit={handleSubmit}
                className="flex-1 bg-white flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
            >
                <div className="w-full max-w-md">
                    <h1 className="text-gray-900 text-3xl sm:text-4xl font-bold mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                        Please fill in your details to get started
                    </p>

                    <div className="space-y-4 sm:space-y-5">
                        {/* Role */}
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Role
                            </label>
                            <select
                                name="role"
                                value={role}
                                onChange={handleonchange}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                            >
                                <option value="">Select your role</option>
                                <option value="DOCTOR">DOCTOR</option>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={fullName}
                                onChange={handleonchange}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border rounded-lg"
                            />
                        </div>

                        {/* Contact */}
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Contact Number
                            </label>
                            <input
                                type="tel"
                                name="contact"
                                value={contact}
                                onChange={handleonchange}
                                placeholder="Enter your contact number"
                                className="w-full px-4 py-3 border rounded-lg"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={handleonchange}
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 border rounded-lg"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={handleonchange}
                                placeholder="Create a password"
                                className="w-full px-4 py-3 border rounded-lg"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleonchange}
                                placeholder="Confirm your password"
                                className="w-full px-4 py-3 border rounded-lg"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
                        >
                            Sign Up
                        </button>

                        {/* Login Link */}
                        <p className="text-center text-sm text-gray-600 mt-4">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-600 font-medium">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SignUp;
