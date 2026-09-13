import express from 'express' 
import { getAUser,getAllUsers ,loginUser, verifyUser, myProfile, updateName} from '../controllers/user.js'
import { isAuth } from '../middleware/isAuth.js'

const router = express.Router(); 


router.post("/login", loginUser);
router.post("/verify",verifyUser);
router.get("/profile",isAuth, myProfile);
router.get("/user/all",isAuth,getAllUsers ); 
router.get("/user/:id",getAUser);
router.post("/update/user",isAuth,updateName); 

export default router; 

