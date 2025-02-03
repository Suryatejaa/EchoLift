const cookie = require('cookie');

// Set a cookie in response
const setCookie = (res, token, expires) => {
    const cookieOptions = {
        httpOnly: process.env.NODE_ENV !== 'development',        // Prevents JavaScript access to cookies (XSS protection)
        secure: true,// process.env.NODE_ENV === 'production',  // Secure cookies in production only
        sameSite: 'none',    // Prevent CSRF attacks
        expires: new Date(Date.now() + expires),
        path: '/'  // Set expiration time for cookie
    };
    res.setHeader('Set-Cookie', cookie.serialize('token', token, cookieOptions));
};

// Retrieve cookie from the request
const getCookie = (req) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    return cookies.token;  
};

module.exports = { setCookie, getCookie };