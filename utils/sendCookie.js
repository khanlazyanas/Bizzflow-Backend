import jwt from 'jsonwebtoken';

export const sendCookie = (user, statusCode, res, message) => {
  // Token generate karo
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15d', 
  });

  // 🔥 FIX: Environment ke hisaab se cookie ki security set karo
  // Agar laptop par ho toh development, server par ho toh production
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
    secure: isProduction,                      // Localhost pe false, Server pe true
    sameSite: isProduction ? "none" : "lax",   // Localhost pe "lax", Server pe "none"
  };

  // Password ko remove karke User data ko frontend me bhej do
  user.password = undefined;

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user, // <-- Ye 'user' JSON frontend ke Context mein jayega
  });
};