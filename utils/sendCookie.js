import jwt from 'jsonwebtoken';

export const sendCookie = (user, statusCode, res, message) => {

  console.log("Mera JWT Secret hai: ", process.env.JWT_SECRET);
  // Token generate karo
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '15d', 
  });

  // Cookie options
  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
    secure: true,      
    sameSite: "none",  
  };

  // FIX: Password ko null karke User data ko frontend me bhej do
  user.password = undefined;

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user, // <-- Ye 'user' JSON frontend ke Context mein jayega
  });
};