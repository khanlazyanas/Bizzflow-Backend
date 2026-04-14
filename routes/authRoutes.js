import express from 'express';
import { registerUser, loginUser, logoutUser, getMyProfile, updateProfile, changePassword } from "../controllers/authControllers.js"
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser); // Logout usually GET request rakhte hain ya POST, dono chalte hain
router.get('/me', isAuthenticated,getMyProfile);
router.put('/update', isAuthenticated, updateProfile);
router.put('/change-password', isAuthenticated, changePassword);

export default router;