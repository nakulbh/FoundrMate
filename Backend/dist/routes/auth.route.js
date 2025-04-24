"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_config_1 = __importDefault(require("../config/passport.config"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
// Redirect user to Google's OAuth consent screen
router.get('/google', passport_config_1.default.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
        'https://www.googleapis.com/auth/gmail.modify'] }));
// Handle callback from Google after user grants permission
router.get('/google/callback', passport_config_1.default.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const user = req.user;
    console.log('User email:', user); // For debugging
    res.redirect('/dashboard');
});
// Endpoint to validate access token
router.get('/validate-token', (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const { token } = req.query;
        // Validate that the token exists and is a string
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ valid: false, message: 'Token is required and must be a string' });
        }
        try {
            // Call the validateToken function
            const result = yield (0, auth_controller_1.validateToken)(token);
            // Respond based on the validation result
            res.status(result.valid ? 200 : 401).json(result);
        }
        catch (error) {
            // Handle unexpected errors
            console.error('Error validating token:', error);
            res.status(500).json({ valid: false, message: 'Internal server error' });
        }
    }))();
});
exports.default = router;
