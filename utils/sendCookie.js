import jwt from 'jsonwebtoken';

// utils/sendCookie.js
export const sendCookie = (user, statusCode, res, message) => {
  // Token generate karo
  const token = user.getJWTToken(); // (Ya jo bhi tumhara token banane ka function hai)

  // CHROME SECURITY BYPASS OPTIONS 👇
  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    httpOnly: true,
    secure: true,        // <-- ZAROORI HAI: Sirf HTTPS par chalega
    sameSite: "none",    // <-- ZAROORI HAI: Cross-origin allow karega
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user,
  });
};