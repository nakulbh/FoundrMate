"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_config_1 = __importDefault(require("./config/passport.config"));
const express_session_1 = __importDefault(require("express-session"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const email_route_1 = __importDefault(require("./routes/email.route"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Session middleware configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Passport middleware
app.use(passport_config_1.default.initialize());
app.use(passport_config_1.default.session());
// Debug: Print environment variables (remove in production)
console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || 'not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '****' : 'not set');
console.log('PORT:', process.env.PORT || '4000 (default)');
// Routes
app.use('/auth', auth_route_1.default);
app.use('/email', email_route_1.default);
// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
