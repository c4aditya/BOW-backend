const express = require('express');
const router = express.Router();
const {
    createCourse,
    getCourses,
    getFilteredCourses,
    getVideoUrl,
    trackProgress,
    pauseResumeCourses,
    getPauseStatus,
    requestClassAccess,
    getClassAccessStatus,
    getAllClassAccessStatuses,
    getAdminClassAccessRequests,
    approveClassAccessRequest,
    rejectClassAccessRequest,
    deleteClassAccessRequest,
    bulkDeleteClassAccessRequests,
    getAdminAllCourses,
    updateCourse,
    deleteCourse,
    manualGrantClassAccess
} = require('../controllers/course.controller');
const { authMiddleware, isAdmin, isUser } = require('../middleware/auth.middleware');

// Admin only routes
router.post('/create-course', authMiddleware, isAdmin, createCourse);
router.get('/admin/courses', authMiddleware, isAdmin, getAdminAllCourses);
router.get('/courses/admin/courses', authMiddleware, isAdmin, getAdminAllCourses);
router.get('/courses/admin', authMiddleware, isAdmin, getAdminAllCourses);

router.put('/admin/course/:id', authMiddleware, isAdmin, updateCourse);
router.put('/courses/admin/course/:id', authMiddleware, isAdmin, updateCourse);

router.delete('/admin/course/:id', authMiddleware, isAdmin, deleteCourse);
router.delete('/courses/admin/course/:id', authMiddleware, isAdmin, deleteCourse);
router.delete('/delete-course/:id', authMiddleware, isAdmin, deleteCourse);

router.patch(
    "/pause-courses",
    authMiddleware,
    isAdmin,
    pauseResumeCourses
);

router.get(
    "/pause-courses",
    authMiddleware,
    isAdmin,
    getPauseStatus
);

// Admin Per Class Access Requests
router.post('/admin/grant-access', authMiddleware, isAdmin, manualGrantClassAccess);
router.post('/courses/admin/grant-access', authMiddleware, isAdmin, manualGrantClassAccess);
router.post('/admin/grant-class-access', authMiddleware, isAdmin, manualGrantClassAccess);
router.get('/admin/class-access-requests', authMiddleware, isAdmin, getAdminClassAccessRequests);
router.post('/admin/class-access-requests/bulk-delete', authMiddleware, isAdmin, bulkDeleteClassAccessRequests);
router.delete('/admin/class-access-requests/bulk-delete', authMiddleware, isAdmin, bulkDeleteClassAccessRequests);
router.patch('/admin/class-access-request/:id/approve', authMiddleware, isAdmin, approveClassAccessRequest);
router.patch('/admin/class-access-request/:id/reject', authMiddleware, isAdmin, rejectClassAccessRequest);
router.delete('/admin/class-access-request/:id', authMiddleware, isAdmin, deleteClassAccessRequest);
// Support alternate route paths as well
router.patch('/admin/class-request/:id/approve', authMiddleware, isAdmin, approveClassAccessRequest);
router.patch('/admin/class-request/:id/reject', authMiddleware, isAdmin, rejectClassAccessRequest);
router.delete('/admin/class-request/:id', authMiddleware, isAdmin, deleteClassAccessRequest);

// Student Per Class Access Requests
router.post('/request-class-access', authMiddleware, isUser, requestClassAccess);
router.get('/class-access-status/:classId', authMiddleware, isUser, getClassAccessStatus);
router.get('/class-access-statuses', authMiddleware, isUser, getAllClassAccessStatuses);

// User only routes (Enrollment based & Filter)
router.get('/courses/filter', authMiddleware, isUser, getFilteredCourses);
router.get('/videos/filter', authMiddleware, isUser, getFilteredCourses);
router.get('/courses', authMiddleware, isUser, getCourses);

// Secure video retrieval route
router.get('/video/:id', authMiddleware, isUser, getVideoUrl);

// Video progress tracking route
router.post('/progress/:id', authMiddleware, isUser, trackProgress);

module.exports = router;
