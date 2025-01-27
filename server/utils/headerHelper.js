// Set a token in response header
const setHeader = (res, token) => {
    res.setHeader('Authorization', `Bearer ${token}`);
};

// Retrieve token from the request header
const getHeader = (req) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    return token;  // Return the token value from the header
};

module.exports = { setHeader, getHeader };