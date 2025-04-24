"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/emailRoutes.ts
const express_1 = require("express");
const email_controller_1 = require("../controllers/email.controller");
const router = (0, express_1.Router)();
// Middleware to check if user is authenticated and has an accessToken
const isAuthenticated = (req, res, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        // Set the access token for use in downstream middleware/controllers
        req.accessToken = token;
        // Create a user object to match your existing code's expectations
        req.user = { accessToken: token };
        return next();
    }
    res.status(401).json({ error: 'Not authenticated or missing access token' });
};
router.get('/list', isAuthenticated, email_controller_1.getEmails);
exports.default = router;
