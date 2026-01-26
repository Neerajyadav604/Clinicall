const express = require("express");
const app = express();
const connectDb = require('./config/Database')
require('dotenv').config();
const Auth = require("./routes/Auth")
const Doctor = require("./routes/Doctor")
const UserRequests = require("./routes/UserRequests")
const fileUpload = require("express-fileupload");
const Registration = require("./routes/Registration")
const Admin = require("./routes/Admin")
const {connectCloudinary} = require('./config/Cloudinary')
const cors = require("cors");
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello Express!");
});


app.use(
  cors({
    origin:[
      "http://localhost:3000",
      "http://192.168.124.137:3000"
    ], 
    credentials: true,              
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use(express.json());
connectCloudinary()
connectDb();

app.use("/api/v1",Auth)
app.use("/api/v1",Doctor)
app.use("/api/v1",UserRequests)
app.use("/api/v1",Registration)
app.use("/api/v1/admin",Admin)


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✔️`);
});