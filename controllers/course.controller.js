const mongoose = require('mongoose');
const User = require('../model/user.model');
const Course = require('../model/course.model');
const InterviewClass = require('../model/interviewClass.model');
const Settings = require("../model/Seeting.model");
const ClassAccessRequest = require('../model/classAccessRequest.model');
const { sendClassApprovedEmail, sendClassRejectedEmail } = require('../utils/classApproveMailSend');

const createCourse = async (req, res) => {
    try {
        console.log("COURSE DATA:", req.body);
        console.log("CREATED BY:", req.user);

        const { title, description, duration, videoUrl, month, classNumber, targetSequence, teacherName, languageMedium } = req.body;

        // Validation
        if (!title || !description || !duration || !videoUrl || !month) {
            console.log("ERROR: Missing fields in course creation");
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const numVal = (classNumber !== undefined && classNumber !== null && classNumber !== '')
            ? Number(classNumber)
            : ((targetSequence !== undefined && targetSequence !== null && targetSequence !== '') ? Number(targetSequence) : null);

        const course = await Course.create({
            title,
            description,
            duration,
            videoUrl,
            month,
            classNumber: numVal,
            ...(teacherName ? { teacherName } : {}),
            ...(languageMedium ? { languageMedium } : {})
        });

        console.log("SUCCESS: Course created -", title);
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });
    } catch (error) {
        console.log("ERROR: Course creation failed -", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getCourses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        console.log("USER ENROLLMENT:", user.enrolledMonth);

        const settings = await Settings.findOne();
        const isCoursePaused = settings?.isCoursePaused || false;

        let courses;
        if (user.enrolledMonth === "1" || user.enrolledMonth === "1 month") {
            courses = await Course.find({ duration: "1" }).sort({ classNumber: 1, createdAt: 1 });
        } else if (user.enrolledMonth === "2" || user.enrolledMonth === "2 month" || user.enrolledMonth === "2 months") {
            courses = await Course.find({ duration: { $in: ["1", "2"] } }).sort({ classNumber: 1, createdAt: 1 });
        } else {
            courses = [];
        }

        const accessRequests = await ClassAccessRequest.find({ userId: user._id }).sort({ createdAt: 1 });
        const requestMap = {};
        accessRequests.forEach(r => {
            if (r.classId) {
                requestMap[r.classId.toString()] = r.status;
            }
        });

        const userLastWatched = user.lastWatchedClass || 0;

        let nextClassIndex = -1;
        for (let i = 0; i < courses.length; i++) {
            const isIntro = i === 0;
            const isWatched = i <= userLastWatched;
            const status = (isIntro || isWatched) ? 'Approved' : (requestMap[courses[i]._id.toString()] || 'Not Requested');
            if (status !== 'Approved') {
                nextClassIndex = i;
                break;
            }
        }

        const lastApprovedReq = accessRequests
            .filter(r => r.status === 'Approved' && (r.approvedAt || r.updatedAt))
            .sort((a, b) => new Date(b.approvedAt || b.updatedAt).getTime() - new Date(a.approvedAt || a.updatedAt).getTime())[0];

        const lastApprovedAt = lastApprovedReq ? new Date(lastApprovedReq.approvedAt || lastApprovedReq.updatedAt).getTime() : null;
        const nextGrantAccessTime = lastApprovedAt ? (lastApprovedAt + 12 * 60 * 60 * 1000) : null;

        const accessTime = new Date(user.approvedAt || user.createdAt).getTime();
        const securedCourses = courses.map((course, index) => {
            const unlockTime = accessTime + index * 12 * 60 * 60 * 1000;
            const isLocked = Date.now() < unlockTime;
            const courseObj = course.toObject();

            const effectiveNum = (course.classNumber !== undefined && course.classNumber !== null && !isNaN(Number(course.classNumber)))
                ? Number(course.classNumber)
                : index;

            const isIntro = effectiveNum === 0;
            const isWatched = index <= userLastWatched;
            courseObj.classNumber = effectiveNum;
            courseObj.globalIndex = effectiveNum;
            courseObj.isIntro = isIntro;
            courseObj.accessStatus = (isIntro || isWatched) ? 'Approved' : (requestMap[course._id.toString()] || 'Not Requested');
            courseObj.isNextClass = index === nextClassIndex;
            courseObj.isFutureLocked = nextClassIndex !== -1 && index > nextClassIndex;
            courseObj.lastApprovedAt = lastApprovedAt;
            courseObj.nextGrantAccessTime = nextGrantAccessTime;

            if (isCoursePaused) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.isPaused = true;
                courseObj.lockReason = "Classes are temporarily paused by admin.";
                return courseObj;
            }

            const isApproved = courseObj.accessStatus === 'Approved';

            if (isLocked && !isApproved) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.unlockTime = unlockTime;
            } else {
                courseObj.isLocked = false;
                courseObj.unlockTime = unlockTime;
            }

            return courseObj;
        });

        console.log("TOTAL COURSES:", securedCourses.length);
        res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            totalCourses: securedCourses.length,
            courses: securedCourses
        });
    } catch (error) {
        console.log("ERROR: Failed to fetch courses -", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getVideoUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        let courses;
        if (user.enrolledMonth === "1" || user.enrolledMonth === "1 month") {
            courses = await Course.find({ duration: "1" }).sort({ classNumber: 1, createdAt: 1 });
        } else if (user.enrolledMonth === "2" || user.enrolledMonth === "2 month" || user.enrolledMonth === "2 months") {
            courses = await Course.find({ duration: { $in: ["1", "2"] } }).sort({ classNumber: 1, createdAt: 1 });
        } else {
            courses = [];
        }

        const courseIndex = courses.findIndex(c => c._id.toString() === id);
        if (courseIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const accessTime = new Date(user.approvedAt || user.createdAt).getTime();
        const unlockTime = accessTime + courseIndex * 12 * 60 * 60 * 1000;
        const isLocked = Date.now() < unlockTime;

        // Check Class Access Approval (Intro Class / index 0 and watched classes are exempt)
        const isIntroClass = courseIndex === 0;
        const isWatched = courseIndex <= (user.lastWatchedClass || 0);
        let isApproved = isIntroClass || isWatched;

        if (!isApproved) {
            const course = courses[courseIndex];
            const accessReq = await ClassAccessRequest.findOne({
                userId: user._id,
                classId: course._id,
                status: 'Approved'
            });
            if (accessReq) {
                isApproved = true;
            }
        }

        if (isLocked && !isApproved) {
            return res.status(403).json({
                success: false,
                message: `This video is locked. It will be available on ${new Date(unlockTime).toISOString()}`
            });
        }

        const settings = await Settings.findOne();
        if (settings?.isCoursePaused) {
            return res.status(403).json({
                success: false,
                message: "Classes are temporarily paused by admin."
            });
        }

        if (!isApproved) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin approval required for this class."
            });
        }

        const course = courses[courseIndex];

        res.status(200).json({
            success: true,
            videoUrl: course.videoUrl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const trackProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { classNumber } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const videoIdObj = new mongoose.Types.ObjectId(id);
        const alreadyWatched = user.watchedVideos.some((v) => v.equals(videoIdObj));
        if (!alreadyWatched) {
            user.watchedVideos.push(videoIdObj);
        }

        if (classNumber !== undefined && classNumber !== null && !isNaN(Number(classNumber))) {
            const newClassNum = Number(classNumber);
            if (!user.lastWatchedClass || newClassNum > user.lastWatchedClass) {
                user.lastWatchedClass = newClassNum;
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Progress tracked successfully',
            progressCount: user.watchedVideos.length,
            lastWatchedClass: user.lastWatchedClass
        });
    } catch (error) {
        console.error("TRACK PROGRESS ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const pauseResumeCourses = async (req, res) => {
    try {
        const { isPaused } = req.body;

        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({
                isCoursePaused: isPaused
            });
        } else {
            settings.isCoursePaused = isPaused;
            await settings.save();
        }

        return res.status(200).json({
            success: true,
            message: isPaused
                ? "All classes paused successfully"
                : "All classes resumed successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getPauseStatus = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({
                isCoursePaused: false
            });
        }

        return res.status(200).json({
            success: true,
            isCoursePaused: settings.isCoursePaused
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== PER CLASS ACCESS CONTROLLERS ====================

const requestClassAccess = async (req, res) => {
    try {
        const { courseId, classId, classNumber } = req.body;
        const userId = req.user.id;

        const targetClassId = classId || courseId;
        if (!targetClassId) {
            return res.status(400).json({ success: false, message: "classId or courseId is required" });
        }

        const course = await Course.findById(targetClassId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let courses;
        if (user.enrolledMonth === "1" || user.enrolledMonth === "1 month") {
            courses = await Course.find({ duration: "1" }).sort({ classNumber: 1, createdAt: 1 });
        } else if (user.enrolledMonth === "2" || user.enrolledMonth === "2 month" || user.enrolledMonth === "2 months") {
            courses = await Course.find({ duration: { $in: ["1", "2"] } }).sort({ classNumber: 1, createdAt: 1 });
        } else {
            courses = [];
        }

        const targetIndex = courses.findIndex(c => c._id.toString() === targetClassId.toString());
        if (targetIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "Class not found or not included in your enrolled courses."
            });
        }

        const accessRequests = await ClassAccessRequest.find({ userId: user._id }).sort({ createdAt: 1 });
        const requestMap = {};
        accessRequests.forEach(r => {
            if (r.classId) {
                requestMap[r.classId.toString()] = r.status;
            }
        });

        const userLastWatched = user.lastWatchedClass || 0;

        let nextClassIndex = -1;
        for (let i = 0; i < courses.length; i++) {
            const effectiveNum = (courses[i].classNumber !== undefined && courses[i].classNumber !== null && !isNaN(Number(courses[i].classNumber)))
                ? Number(courses[i].classNumber)
                : i;
            const isIntro = effectiveNum === 0;
            const isWatched = i <= userLastWatched;
            const status = (isIntro || isWatched) ? 'Approved' : (requestMap[courses[i]._id.toString()] || 'Not Requested');
            if (status !== 'Approved') {
                nextClassIndex = i;
                break;
            }
        }

        if (nextClassIndex === -1 || targetIndex !== nextClassIndex) {
            return res.status(400).json({
                success: false,
                message: "You can only request access for the next available class."
            });
        }

        // Check if existing request exists
        const existingReq = await ClassAccessRequest.findOne({
            userId,
            classId: targetClassId
        }).sort({ createdAt: -1 });

        if (existingReq) {
            if (existingReq.status === 'Approved') {
                return res.status(400).json({
                    success: false,
                    message: "Already Approved",
                    status: "Approved"
                });
            }

            if (existingReq.status === 'Pending') {
                return res.status(400).json({
                    success: false,
                    message: "Access request already pending",
                    status: "Pending"
                });
            }

            if (existingReq.status === 'Rejected') {
                existingReq.status = 'Pending';
                existingReq.requestedAt = new Date();
                existingReq.rejectedAt = undefined;
                existingReq.rejectedBy = undefined;
                await existingReq.save();

                return res.status(200).json({
                    success: true,
                    message: "Access requested successfully",
                    request: existingReq
                });
            }
        }

        const newRequest = await ClassAccessRequest.create({
            userId,
            courseId: course._id,
            classId: course._id,
            classNumber: classNumber || course.title,
            status: 'Pending',
            requestedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Access requested successfully",
            request: newRequest
        });
    } catch (error) {
        console.error("REQUEST CLASS ACCESS ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getClassAccessStatus = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.id;

        const request = await ClassAccessRequest.findOne({
            userId,
            classId
        }).sort({ createdAt: -1 });

        if (!request) {
            return res.status(200).json({
                success: true,
                status: 'Not Requested'
            });
        }

        return res.status(200).json({
            success: true,
            status: request.status
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllClassAccessStatuses = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await ClassAccessRequest.find({ userId });

        const statusMap = {};
        requests.forEach(r => {
            statusMap[r.classId.toString()] = r.status;
        });

        return res.status(200).json({
            success: true,
            statuses: statusMap
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminClassAccessRequests = async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};
        if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
            filter.status = status;
        }

        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id');

            const userIds = matchingUsers.map(u => u._id);
            filter.userId = { $in: userIds };
        }

        const requests = await ClassAccessRequest.find(filter)
            .populate('userId', 'name email lastWatchedClass watchedVideos')
            .populate('courseId', 'title duration month')
            .sort({ createdAt: -1 });

        // If courseId could not be populated from Course, check InterviewClass
        for (const reqDoc of requests) {
            if (!reqDoc.courseId && reqDoc.classId) {
                const iClass = await InterviewClass.findById(reqDoc.classId).select('title duration month');
                if (iClass) {
                    reqDoc.courseId = iClass;
                }
            }
        }

        const requestsWithLastApproved = await Promise.all(requests.map(async (reqDoc) => {
            const reqObj = reqDoc.toObject();
            if (reqDoc.userId && reqDoc.userId._id) {
                const lastApproved = await ClassAccessRequest.findOne({
                    userId: reqDoc.userId._id,
                    status: 'Approved',
                    _id: { $ne: reqDoc._id }
                })
                .populate('courseId', 'title')
                .sort({ approvedAt: -1, createdAt: -1 });

                if (lastApproved && (lastApproved.approvedAt || lastApproved.updatedAt)) {
                    if (!lastApproved.courseId && lastApproved.classId) {
                        lastApproved.courseId = await InterviewClass.findById(lastApproved.classId).select('title');
                    }
                    reqObj.lastApprovedDate = lastApproved.approvedAt || lastApproved.updatedAt;
                    reqObj.lastApprovedClass = lastApproved.classNumber || lastApproved.courseId?.title || 'N/A';
                } else {
                    reqObj.lastApprovedDate = null;
                    reqObj.lastApprovedClass = 'N/A';
                }
            } else {
                reqObj.lastApprovedDate = null;
                reqObj.lastApprovedClass = 'N/A';
            }
            return reqObj;
        }));

        res.status(200).json({
            success: true,
            requests: requestsWithLastApproved
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const approveClassAccessRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ClassAccessRequest.findById(id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        request.status = 'Approved';
        request.approvedAt = new Date();
        request.approvedBy = req.user.email || req.user.id;
        await request.save();

        // Update user's lastApprovedClass upon admin approval
        try {
            const courseDoc = await Course.findById(request.courseId) || await InterviewClass.findById(request.courseId);
            const approvedClassVal = request.classNumber || courseDoc?.title || 'Class';
            await User.findByIdAndUpdate(request.userId, { lastApprovedClass: approvedClassVal });
        } catch (userUpdateErr) {
            console.error("[USER UPDATE ERROR] Failed to update user lastApprovedClass:", userUpdateErr);
        }

        // Send Email Notification asynchronously after DB update succeeds
        try {
            const user = await User.findById(request.userId);
            const course = await Course.findById(request.courseId) || await InterviewClass.findById(request.courseId);
            if (user && user.email) {
                await sendClassApprovedEmail({
                    userEmail: user.email,
                    userName: user.name,
                    classNumber: request.classNumber,
                    className: course?.title || request.classNumber
                });
            } else {
                console.error(`[EMAIL WARN] Could not send approval email: User not found or missing email address for userId ${request.userId}`);
            }
        } catch (emailErr) {
            console.error("[EMAIL ERROR] Exception during approval email dispatch:", emailErr);
        }

        res.status(200).json({
            success: true,
            message: "Class access request approved successfully",
            request
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const rejectClassAccessRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ClassAccessRequest.findById(id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        request.status = 'Rejected';
        request.rejectedAt = new Date();
        request.rejectedBy = req.user.email || req.user.id;
        await request.save();

        // Send Email Notification asynchronously after DB update succeeds
        try {
            const user = await User.findById(request.userId);
            const course = await Course.findById(request.courseId) || await InterviewClass.findById(request.courseId);
            if (user && user.email) {
                await sendClassRejectedEmail({
                    userEmail: user.email,
                    userName: user.name,
                    classNumber: request.classNumber,
                    className: course?.title || request.classNumber
                });
            } else {
                console.error(`[EMAIL WARN] Could not send rejection email: User not found or missing email address for userId ${request.userId}`);
            }
        } catch (emailErr) {
            console.error("[EMAIL ERROR] Exception during rejection email dispatch:", emailErr);
        }

        res.status(200).json({
            success: true,
            message: "Class access request rejected successfully",
            request
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteClassAccessRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ClassAccessRequest.findByIdAndDelete(id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        res.status(200).json({
            success: true,
            message: "Class access request deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const bulkDeleteClassAccessRequests = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No request IDs provided" });
        }

        await ClassAccessRequest.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            message: `${ids.length} class access request(s) deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getFilteredCourses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let reqMonth = String(req.query.month || '1').toLowerCase().trim();
        if (reqMonth === 'month 1' || reqMonth === 'month1') reqMonth = '1';
        if (reqMonth === 'month 2' || reqMonth === 'month2') reqMonth = '2';

        const is1MonthEnrolled = user.enrolledMonth === "1" || user.enrolledMonth === "1 month";
        const is2MonthEnrolled = user.enrolledMonth === "2" || user.enrolledMonth === "2 month" || user.enrolledMonth === "2 months";

        let allAuthorizedQuery;
        if (is1MonthEnrolled) {
            allAuthorizedQuery = { duration: "1" };
        } else if (is2MonthEnrolled) {
            allAuthorizedQuery = { duration: { $in: ["1", "2"] } };
        } else {
            return res.status(200).json({
                success: true,
                message: "No active enrollment",
                totalCourses: 0,
                courses: []
            });
        }

        const allAuthorizedCourses = await Course.find(allAuthorizedQuery).sort({ classNumber: 1, createdAt: 1 });

        const settings = await Settings.findOne();
        const isCoursePaused = settings?.isCoursePaused || false;

        const accessRequests = await ClassAccessRequest.find({ userId: user._id }).sort({ createdAt: 1 });
        const requestMap = {};
        accessRequests.forEach(r => {
            if (r.classId) {
                requestMap[r.classId.toString()] = r.status;
            }
        });

        const userLastWatched = user.lastWatchedClass || 0;

        let nextClassIndex = -1;
        for (let i = 0; i < allAuthorizedCourses.length; i++) {
            const isIntro = i === 0;
            const isWatched = i <= userLastWatched;
            const status = (isIntro || isWatched) ? 'Approved' : (requestMap[allAuthorizedCourses[i]._id.toString()] || 'Not Requested');
            if (status !== 'Approved') {
                nextClassIndex = i;
                break;
            }
        }

        const lastApprovedReq = accessRequests
            .filter(r => r.status === 'Approved' && (r.approvedAt || r.updatedAt))
            .sort((a, b) => new Date(b.approvedAt || b.updatedAt).getTime() - new Date(a.approvedAt || a.updatedAt).getTime())[0];

        const lastApprovedAt = lastApprovedReq ? new Date(lastApprovedReq.approvedAt || lastApprovedReq.updatedAt).getTime() : null;
        const nextGrantAccessTime = lastApprovedAt ? (lastApprovedAt + 12 * 60 * 60 * 1000) : null;

        const accessTime = new Date(user.approvedAt || user.createdAt).getTime();
        const allSecuredCourses = allAuthorizedCourses.map((course, index) => {
            const unlockTime = accessTime + index * 12 * 60 * 60 * 1000;
            const isLocked = Date.now() < unlockTime;
            const courseObj = course.toObject();

            const effectiveNum = (course.classNumber !== undefined && course.classNumber !== null && !isNaN(Number(course.classNumber)))
                ? Number(course.classNumber)
                : index;

            const isIntro = effectiveNum === 0;
            const isWatched = index <= userLastWatched;
            courseObj.classNumber = effectiveNum;
            courseObj.globalIndex = effectiveNum;
            courseObj.isIntro = isIntro;
            courseObj.accessStatus = (isIntro || isWatched) ? 'Approved' : (requestMap[course._id.toString()] || 'Not Requested');
            courseObj.isNextClass = index === nextClassIndex;
            courseObj.isFutureLocked = nextClassIndex !== -1 && index > nextClassIndex;
            courseObj.lastApprovedAt = lastApprovedAt;
            courseObj.nextGrantAccessTime = nextGrantAccessTime;

            if (isCoursePaused) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.isPaused = true;
                courseObj.lockReason = "Classes are temporarily paused by admin.";
                return courseObj;
            }

            const isApproved = courseObj.accessStatus === 'Approved';

            if (isLocked && !isApproved) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.unlockTime = unlockTime;
            } else {
                courseObj.isLocked = false;
                courseObj.unlockTime = unlockTime;
            }

            return courseObj;
        });

        let finalSecuredCourses = allSecuredCourses;
        if (reqMonth === '1') {
            finalSecuredCourses = allSecuredCourses.filter(c => String(c.duration).trim() === '1');
        } else if (reqMonth === '2') {
            if (is1MonthEnrolled) {
                finalSecuredCourses = [];
            } else {
                finalSecuredCourses = allSecuredCourses.filter(c => String(c.duration).trim() === '2');
            }
        }

        res.status(200).json({
            success: true,
            message: "Filtered courses fetched successfully",
            totalCourses: finalSecuredCourses.length,
            courses: finalSecuredCourses
        });
    } catch (error) {
        console.log("ERROR: Failed to fetch filtered courses -", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAdminAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({}).sort({ classNumber: 1, createdAt: 1 });
        const coursesWithIndex = courses.map((c, index) => {
            const obj = c.toObject();
            const effectiveNum = (c.classNumber !== undefined && c.classNumber !== null && !isNaN(Number(c.classNumber)))
                ? Number(c.classNumber)
                : index;
            obj.globalIndex = effectiveNum;
            obj.classNumber = effectiveNum;
            return obj;
        });
        res.status(200).json({
            success: true,
            totalCourses: coursesWithIndex.length,
            courses: coursesWithIndex
        });
    } catch (error) {
        console.error("ERROR: Failed to fetch admin courses -", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, teacherName, languageMedium, duration, videoUrl, month, classNumber, targetSequence } = req.body;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (title !== undefined) course.title = title.trim();
        if (description !== undefined) course.description = description.trim();
        if (teacherName !== undefined) course.teacherName = teacherName.trim();
        if (languageMedium !== undefined) course.languageMedium = languageMedium.trim();
        if (duration !== undefined) course.duration = String(duration).trim();
        if (videoUrl !== undefined) course.videoUrl = videoUrl.trim();
        if (month !== undefined) course.month = Number(month);

        const numVal = (classNumber !== undefined && classNumber !== null && classNumber !== '')
            ? Number(classNumber)
            : ((targetSequence !== undefined && targetSequence !== null && targetSequence !== '') ? Number(targetSequence) : undefined);

        if (numVal !== undefined && !isNaN(numVal)) {
            course.classNumber = numVal;
        }

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course
        });
    } catch (error) {
        console.error("ERROR: Course update failed -", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course/Class not found"
            });
        }

        await Course.findByIdAndDelete(id);

        // Clean up associated access requests for this deleted class
        await ClassAccessRequest.deleteMany({ classId: id });

        res.status(200).json({
            success: true,
            message: "Class deleted successfully"
        });
    } catch (error) {
        console.error("ERROR: Course deletion failed -", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const manualGrantClassAccess = async (req, res) => {
    try {
        const { userId, courseId, classId, classNumber } = req.body;
        const targetId = classId || courseId;

        if (!userId || !targetId) {
            return res.status(400).json({ success: false, message: "userId and classId/courseId are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const courseDoc = await Course.findById(targetId) || await InterviewClass.findById(targetId);
        if (!courseDoc) {
            return res.status(404).json({ success: false, message: "Class/Course not found" });
        }

        const label = classNumber || courseDoc.title || 'Class';

        let accessReq = await ClassAccessRequest.findOne({ userId, classId: targetId });
        if (accessReq) {
            accessReq.status = 'Approved';
            accessReq.classNumber = label;
            accessReq.approvedAt = new Date();
            accessReq.approvedBy = req.user.email || req.user.id;
            await accessReq.save();
        } else {
            accessReq = await ClassAccessRequest.create({
                userId,
                courseId: courseDoc._id,
                classId: courseDoc._id,
                classNumber: label,
                status: 'Approved',
                approvedAt: new Date(),
                approvedBy: req.user.email || req.user.id
            });
        }

        user.lastApprovedClass = label;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Class access granted successfully",
            request: accessReq,
            lastApprovedClass: label
        });
    } catch (error) {
        console.error("MANUAL GRANT CLASS ACCESS ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
};
