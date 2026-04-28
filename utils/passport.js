import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // 🔥 100% FIX 1: Yahan humne pura exact Live URL hardcode kar diya hai
    callbackURL: "https://bizzflow-backend.onrender.com/api/auth/google/callback",
    // 🔥 100% FIX 2: Render jaise cloud servers ke liye ye line likhna zaroori hai
    proxy: true 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
         if(!user.googleId) {
             user.googleId = profile.id;
             await user.save();
         }
         return done(null, user);
      } else {
         const newUser = await User.create({
            fullName: profile.displayName,  
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "" 
         });
         return done(null, newUser);
      }
    } catch (error) {
      console.log("❌ Passport Error: ", error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});