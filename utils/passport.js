import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check karo agar user pehle se database me hai
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
         // Agar user purana hai par Google ID nahi hai, toh ID save kar lo
         if(!user.googleId) {
             user.googleId = profile.id;
             await user.save();
         }
         return done(null, user);
      } else {
         // Naya user create karo (Google se details utha kar)
         const newUser = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            // avatar: profile.photos[0].value // Agar avatar store karte ho toh
         });
         return done(null, newUser);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});