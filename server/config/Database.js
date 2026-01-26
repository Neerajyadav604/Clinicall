const mongoose = require("mongoose");
require('dotenv').config();


const connectDb = async()=>{

    await mongoose.connect(process.env.DATABASEURL
    )
    .then(()=>{
        console.log("Connected to Database Successfully 🟢")
    })
.catch((err)=>{
    console.log("Failed to connect to Dtabase 🔴 :",err)
    process.exit(1);
})
  
}
module.exports = connectDb;