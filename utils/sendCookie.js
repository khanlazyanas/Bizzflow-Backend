import jwt from 'jsonwebtoken';

export const sendCookie = (user, statusCode, res, message) => {
  // 1. Token generate
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15d', 
  });

  // 2. Cookie Options
  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
    secure: true,        
    sameSite: "none",    
  };

  // 3. Password hata do
  user.password = undefined;

  // 4. Send Response
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user, // FIX: Frontend ko ye user data yahan se milega
  });
};