import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

// Google OAuth Strategy (only initialize if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            if (!user.profile.profilePicture) {
              user.profile.profilePicture = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            userType: 'user',
            profile: {
              profilePicture: profile.photos[0].value,
            },
            profileCompletion: 20, // Basic info provided
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
    }
  ));
}

// Facebook OAuth Strategy (only initialize if credentials are provided)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          if (profile.emails && profile.emails[0]) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // Link Facebook account to existing user
              user.facebookId = profile.id;
              if (!user.profile.profilePicture && profile.photos && profile.photos[0]) {
                user.profile.profilePicture = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            facebookId: profile.id,
            userType: 'user',
            profile: {
              profilePicture: profile.photos?.[0]?.value,
            },
            profileCompletion: 20,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
    }
  ));
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
