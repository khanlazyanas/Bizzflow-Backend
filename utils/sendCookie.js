import jwt from 'jsonwebtoken'; // Isko import karna zaroori hai

export const sendCookie = (user, statusCode, res, message) => {
  // 1. Token yahin generate karo (model se mangne ki zaroorat nahi)
  // Make sure tumhari .env file mein JWT_SECRET likha ho
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15d', // Token 15 din tak chalega
  });

  // 2. CHROME SECURITY BYPASS OPTIONS 
  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    httpOnly: true,
    secure: true,        // <-- ZAROORI HAI: Sirf HTTPS (Render) par chalega
    sameSite: "none",    // <-- ZAROORI HAI: Cross-origin allow karega
  };

  // 3. Cookie set karo aur response bhejo
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user,
  });
};