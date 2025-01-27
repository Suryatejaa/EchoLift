/**
 * Create a middleware named validatePagination.js for validating query parameters (page and limit).  

- Use express-validator to check that 'page' and 'limit' are numbers and greater than 0.  
- Handle errors using validationResult.  
- If errors exist, send a 400 Bad Request response with error details.  
- Export the middleware for validating pagination in routes.  

 */
const { check, validationResult } = require('express-validator');
const validatePagination = [
    check('page', 'Page must be a number and greater than 0').isNumeric().isInt({ gt: 0 }),
    check('limit', 'Limit must be a number and greater than 0').isNumeric().isInt({ gt: 0 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
module.exports = validatePagination;
