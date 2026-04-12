import jwt from 'jsonwebtoken';

export const sendCookie = (user, statusCode, res, message) => {
  // 1. Token yahin generate karo
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

  // 3. SECURITY FIX: Password hash ko frontend me bhejne se roko!
  user.password = undefined;

  // 4. Cookie set karo aur response bhejo
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user, // Ab user object ke andar 'fullName' aayega, bina password ke
  });
};