const cloudinary = require('cloudinary').v2
require('dotenv').config();

exports.connectCloudinary =   ()=>{


    try{
        cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

console.log("Connected to cloudnairy Successfully")
    }catch(err){
        console.log("Failed to connect to cloudnairy",err)
    }
    

}

