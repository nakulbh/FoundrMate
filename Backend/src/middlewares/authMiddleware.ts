export const authMiddleware= (req: any, res: any, next: any) => {
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