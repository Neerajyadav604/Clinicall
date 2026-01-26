import React from "react";
import doctorimg from "../assets/logindoctor.png"
import { useState } from "react";
import { login } from "../services/operations/Authapi";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
const Login = () => {
const navigate = useNavigate()
const dispatch = useDispatch()
const [formdata, setformdata] = useState({
  email:"",
  password:""
})

const {email,password}=formdata

const handleOnchange=(e)=>{
setformdata((prev)=>({
...prev,[e.target.name]:e.target.value
}))
}

const handleOnSubmit=(e)=>{
e.preventDefault()
dispatch(login(email,password, navigate))

}

  return (
    <div className="h-screen w-full flex mt-28">
      {/* Left Side - Image */}
      <div className="flex-1 bg-black-100">
        <img 
          src={doctorimg} 
          alt="Doctor" 
          className="h-full w-full object-cover"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h1 className="text-black text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-black-400 mb-8">Please enter your details to sign in</p>

          <form onSubmit={handleOnSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-black-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                name="email"
                onChange={handleOnchange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-black-900 border border-black-800 rounded-lg text-black placeholder-black-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-black-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleOnchange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-black-900 border border-black-800 rounded-lg text-black placeholder-black-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              
              <a href="#" className="text-sm text-blue-500 hover:text-blue-400">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button type ="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Sign In
            </button>

           

            {/* Sign Up Link */}
            <p className="text-center text-sm text-black-400 mt-6">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-500 hover:text-blue-400 font-medium">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;