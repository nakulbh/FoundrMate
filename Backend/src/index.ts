import express from 'express';
import dotenv from 'dotenv';
import passport from './config/passport.config';
import session from 'express-session';
import authRoute from './routes/auth.route';
import emailRoute from './routes/email.route';
import Cors from 'cors';
import { authMiddleware } from './middlewares/authMiddleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

app.use(Cors({origin:true}))

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


const PORT = process.env.PORT || 4000;

// Session middleware configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Debug: Print environment variables (remove in production)
console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || 'not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '****' : 'not set');
console.log('PORT:', process.env.PORT || '4000 (default)');

// Routes
app.use('/auth', authRoute);

// app.use(authMiddleware); 
app.use('/email', authMiddleware, emailRoute);

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));