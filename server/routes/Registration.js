const express = require('express')
const router = express.Router()
const {Registrationapproved,Registrationrejected,getAllRegistrations,deleteDoctor} = require('../Controllers/Registration')
const {authenticateUser,isadmin} = require('../middleware/authMiddleware')

router.get("/registration",isadmin,getAllRegistrations)
router.put("/registration/:id/reject", isadmin,Registrationrejected)
router.put("/registration/:id/approve", isadmin ,Registrationapproved)
router.delete('/registration/:id/delete', authenticateUser, isadmin,deleteDoctor)

module.exports = router;