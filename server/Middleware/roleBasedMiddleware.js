/**
 * Create a middleware named roleMiddleware.js for role-based access control.  

- Accept roles as parameters (e.g., 'brand', 'influencer').  
- Check if req.user.role matches the allowed roles.  
- If the role is not authorized, send a 403 Forbidden response.  
- Export the middleware for protecting routes based on user roles.

 * 
 */

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        next();
    };
};
module.exports;