import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing required environment variables for Google OAuth');
}

// Configure Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:4000/auth/google/callback',
            scope: [

                'https://www.googleapis.com/auth/gmail.modify',
            ]
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Create user data object from profile
                const userData = {
                    id: profile.id,
                    email: profile.emails?.[0]?.value,
                    displayName: profile.displayName,
                    accessToken,
                    refreshToken
                };
                console.log('User data:', userData);
                return done(null, userData);
            } catch (error) {
                return done(error instanceof Error ? error : new Error(String(error)), undefined);
            }
        }
    )
);

// Define custom user interface for TypeScript
interface UserData {
    id: string;
    email?: string;
    displayName: string;
    accessToken: string;
    refreshToken?: string;
}

// Tell passport how to serialize the user
passport.serializeUser((user: any, done) => {
    done(null, user);
});

// Tell passport how to deserialize the user
passport.deserializeUser<UserData>((user, done) => {
    done(null, user);
});

export default passport;