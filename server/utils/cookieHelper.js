const cookie = require('cookie');

// Set a cookie in response
const setCookie = (res, token, expires) => {
    const cookieOptions = {
        httpOnly: process.env.NODE_ENV !== 'development',        // Prevents JavaScript access to cookies (XSS protection)
        secure: process.env.NODE_ENV === 'production',  // Secure cookies in production only
        sameSite: 'Strict',    // Prevent CSRF attacks
        expires: new Date(Date.now() + expires),
        path: '/'  // Set expiration time for cookie
    };
    // console.log('cookie set', token);
    res.setHeader('Set-Cookie', cookie.serialize('token', token, cookieOptions));
};

// Retrieve cookie from the request
const getCookie = (req) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    // console.log('cookie got', token);
    return cookies.token;  // Return the token value from the cookie
};

module.exports = { setCookie, getCookie };