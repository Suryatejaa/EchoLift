const express = require('express');
const { check } = require('express-validator');
const postController = require('../Controller/postController');
const authMiddleware = require('../Middleware/authenticate');
const PostController = require('../Controller/postController');
const authRoutes = require('../Middleware/refreshToken');
const router = express.Router();

// POST /posts - Create a new post (authenticated)
router.post('/posts', [
    check('content').notEmpty().withMessage('Content is required'),
    check('postType').isIn(['Text', 'Image', 'Video', 'Link']).withMessage('Invalid post type')
], authMiddleware, PostController.createPost);

// GET /posts/:id - Get details of a single post (authenticated)
router.get('/posts/:id', authMiddleware, PostController.getPost);

// PATCH /posts/:id - Update an existing post (authenticated, only owner)
router.patch('/posts/:id', [
    check('content').optional().isString().withMessage('Content must be a string'),
    check('title').optional().isString().withMessage('Title must be a string'),
    check('detailedDescription').optional().isString().withMessage('Detailed Description must be a string'),
    check('followersRange').optional().isString().withMessage('Followers Range must be a string'),
    check('category').optional().isString().withMessage('Category must be a string'),
    check('instructions').optional().isArray().withMessage('Instructions must be an array of strings')
], authMiddleware, postController.updatePost);

// DELETE /posts/:id - Delete a post (authenticated, only owner)
router.delete('/posts/:id', authMiddleware, postController.deletePost);

// POST /posts/:id/apply - Apply to a promotion (authenticated)
router.post('/posts/:id/apply', authMiddleware, PostController.applyToPromotion);

// POST /posts/:id/approve - Approve an application (authenticated)
router.post('/posts/:id/approve', authMiddleware, PostController.approveApplication);

// POST /posts/:id/withdraw - Withdraw application from a promotion (authenticated)
router.post('/posts/:id/withdraw', authMiddleware, PostController.withdrawApplication);

// POST /posts/:id/bookmark - Bookmark a post (authenticated)
router.post('/posts/:id/bookmark', authMiddleware, PostController.bookmarkPost);

// POST /posts/:id/unbookmark - Unbookmark a post (authenticated)
router.post('/posts/:id/unbookmark', authMiddleware, PostController.unbookmarkPost);

// POST /posts/:id/removelike - Remove like from a post (authenticated)
router.post('/posts/:id/removelike', authMiddleware, PostController.removeLikeFromPost);

// POST /posts/:id/like - Like a post (authenticated)
router.post('/posts/:id/like', authMiddleware, PostController.likePost);

// POST /posts/:id/accept-submission - Approve a submission (authenticated)
router.post('/posts/:id/accept-submission', authMiddleware, PostController.approveSubmission);

router.use('/auth', authRoutes);

module.exports = router;