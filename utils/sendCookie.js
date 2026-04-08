import jwt from 'jsonwebtoken';

export const sendCookie = (user, statusCode, res, message) => {
  // 1. Token Generate 
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '14d', // 14 din tak login rahega
  });

  // 2. Cookie  options set 
  const options = {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 Days in milliseconds
    httpOnly: true, // XSS attacks se bachane ke liye (JS se read nahi hogi)
    sameSite: 'strict', // CSRF attacks se bachne ke liye
    secure: process.env.NODE_ENV === 'production', // Production mein HTTPS par hi chalegi
  };

  // 3. User object se password hatao taaki frontend pe na jaye
  user.password = undefined;

  // 4. set Cookie and send response
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    user,
  });
};