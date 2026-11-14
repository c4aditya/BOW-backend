const express = require('express');
const router = express.Router();
const {
    createInterviewClass,
    getInterviewClasses,
    getInterviewVideoUrl,
    requestInterviewClassAccess,
    getInterviewClassAccessStatus,
    getAllInterviewClassAccessStatuses,
    getAdminInterviewClasses,
    updateInterviewClass,
    deleteInterviewClass
} = require('../controllers/interviewClass.controller');
const { authMiddleware, isAdmin, isUser } = require('../middleware/auth.middleware');

// Admin routes
router.post('/create', authMiddleware, isAdmin, createInterviewClass);
router.post('/create-course', authMiddleware, isAdmin, createInterviewClass);
router.get('/admin', authMiddleware, isAdmin, getAdminInterviewClasses);
router.get('/admin/courses', authMiddleware, isAdmin, getAdminInterviewClasses);
router.put('/:id', authMiddleware, isAdmin, updateInterviewClass);
router.delete('/:id', authMiddleware, isAdmin, deleteInterviewClass);

// Student access request routes
router.post('/request-access', authMiddleware, isUser, requestInterviewClassAccess);
router.post('/request-class-access', authMiddleware, isUser, requestInterviewClassAccess);
router.get('/access-status/:classId', authMiddleware, isUser, getInterviewClassAccessStatus);
router.get('/class-access-status/:classId', authMiddleware, isUser, getInterviewClassAccessStatus);
router.get('/access-statuses', authMiddleware, isUser, getAllInterviewClassAccessStatuses);
router.get('/class-access-statuses', authMiddleware, isUser, getAllInterviewClassAccessStatuses);

// Student video retrieval route (protected with month & access approval checks)
router.get('/video/:id', authMiddleware, isUser, getInterviewVideoUrl);

// Student course listing routes (with month-based enrollment filtering)
router.get('/filter', authMiddleware, isUser, getInterviewClasses);
router.get('/courses', authMiddleware, isUser, getInterviewClasses);
router.get('/', authMiddleware, isUser, getInterviewClasses);

module.exports = router;
