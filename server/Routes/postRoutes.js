const express = require('express');
const { check } = require('express-validator');
const postController = require('../Controller/postController');
const authMiddleware = require('../Middleware/authenticate');
const PostController = require('../Controller/postController');
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

// POST /posts/:id/withdraw - Withdraw application from a promotion (authenticated)
router.post('/posts/:id/withdraw', authMiddleware, PostController.withdrawApplication);

// POST /posts/:id/bookmark - Bookmark a post (authenticated)
router.post('/posts/:id/bookmark', authMiddleware, PostController.bookmarkPost);

// POST /posts/:id/unbookmark - Unbookmark a post (authenticated)
router.post('/posts/:id/unbookmark', authMiddleware, PostController.unbookmarkPost);

// POST /posts/:id/removelike - Remove like from a post (authenticated)
router.post('/posts/:id/removelike', authMiddleware, PostController.removeLikeFromPost);

router.post('/posts/:id/like', authMiddleware, PostController.likePost);

module.exports = router;