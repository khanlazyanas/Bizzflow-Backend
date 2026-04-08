import express from 'express';
import { registerUser, loginUser, logoutUser, getMyProfile } from "../controllers/authControllers.js"
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser); // Logout usually GET request rakhte hain ya POST, dono chalte hain
router.get('/me', isAuthenticated,getMyProfile);

export default router;