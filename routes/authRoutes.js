import express from 'express';
import { registerUser, loginUser, logoutUser, getMyProfile, updateProfile, changePassword, forgotPassword, resetPassword } from "../controllers/authControllers.js"
import { isAuthenticated } from '../middlewares/auth.js';

// 🔥 NAYA IMPORT: Multer middleware jo photo pakdega
import { singleUpload } from '../middlewares/multer.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser); 
router.get('/me', isAuthenticated, getMyProfile);

// 🔥 FIX: Yahan 'singleUpload' add kar diya hai
router.put('/update', isAuthenticated, singleUpload, updateProfile);

router.put('/change-password', isAuthenticated, changePassword);
router.post('/password/forgot', forgotPassword); 
router.put('/password/reset/:token', resetPassword);

export default router;