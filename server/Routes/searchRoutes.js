const express = require('express');
const router = express.Router();
const searchController = require('../Controller/searchController');
const authMiddleware = require('../middleware/authMiddleware');
const authRoutes = require('../Middleware/refreshToken');

router.use(authMiddleware);
// Define routes with params
router.get('/', authMiddleware, searchController.getSearch);
router.get('/recent', authMiddleware, searchController.getRecentSearches);
router.delete('/recent', authMiddleware, searchController.clearRecentSearches);
router.use('/auth', authRoutes);

module.exports = router;
