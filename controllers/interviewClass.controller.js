const mongoose = require('mongoose');
const User = require('../model/user.model');
const InterviewClass = require('../model/interviewClass.model');
const Settings = require('../model/Seeting.model');
const ClassAccessRequest = require('../model/classAccessRequest.model');

/**
 * Helper to determine user enrollment eligibility
 */
const getUserEnrollmentInfo = (user) => {
    const enrolledStr = String(user?.enrolledMonth || '').toLowerCase().trim();
    const is1MonthEnrolled = enrolledStr === '1' || enrolledStr === '1 month';
    const is2MonthEnrolled = enrolledStr === '2' || enrolledStr === '2 month' || enrolledStr === '2 months';
    return { is1MonthEnrolled, is2MonthEnrolled };
};

/**
 * Admin: Create an Interview Class
 */
const createInterviewClass = async (req, res) => {
    try {
        const { title, description, duration, videoUrl, month, classNumber, teacherName, languageMedium } = req.body;

        if (!title || !duration || !videoUrl || !month) {
            return res.status(400).json({
                success: false,
                message: "Title, duration, video URL, and month are required"
            });
        }

        const numVal = (classNumber !== undefined && classNumber !== null && classNumber !== '')
            ? Number(classNumber)
            : null;

        const interviewClass = await InterviewClass.create({
            title: title.trim(),
            description: (description || '').trim(),
            duration: String(duration).trim(),
            videoUrl: videoUrl.trim(),
            month: Number(month),
            classNumber: numVal,
            ...(teacherName ? { teacherName: teacherName.trim() } : {}),
            ...(languageMedium ? { languageMedium: languageMedium.trim() } : {})
        });

        res.status(201).json({
            success: true,
            message: "Interview class created successfully",
            interviewClass
        });
    } catch (error) {
        console.error("CREATE INTERVIEW CLASS ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Student: Get Interview Classes filtered by month-based enrollment
 */
const getInterviewClasses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { is1MonthEnrolled, is2MonthEnrolled } = getUserEnrollmentInfo(user);

        if (!is1MonthEnrolled && !is2MonthEnrolled) {
            return res.status(200).json({
                success: true,
                message: "No active enrollment",
                totalCourses: 0,
                courses: []
            });
        }

        let baseQuery;
        if (is1MonthEnrolled) {
            baseQuery = { $or: [{ duration: "1" }, { month: 1 }] };
        } else if (is2MonthEnrolled) {
            baseQuery = { $or: [{ duration: { $in: ["1", "2"] } }, { month: { $in: [1, 2] } }] };
        }

        let reqMonth = String(req.query.month || 'all').toLowerCase().trim();
        if (reqMonth === 'month 1' || reqMonth === 'month1') reqMonth = '1';
        if (reqMonth === 'month 2' || reqMonth === 'month2') reqMonth = '2';

        let effectiveQuery = baseQuery;
        if (reqMonth === '1') {
            effectiveQuery = { $or: [{ duration: "1" }, { month: 1 }] };
        } else if (reqMonth === '2') {
            if (is1MonthEnrolled) {
                return res.status(200).json({
                    success: true,
                    totalCourses: 0,
                    courses: []
                });
            }
            effectiveQuery = { $or: [{ duration: "2" }, { month: 2 }] };
        }

        const classes = await InterviewClass.find(effectiveQuery).sort({ classNumber: 1, createdAt: 1 });

        const settings = await Settings.findOne();
        const isCoursePaused = settings?.isCoursePaused || false;

        const accessRequests = await ClassAccessRequest.find({ userId: user._id }).sort({ createdAt: 1 });
        const requestMap = {};
        accessRequests.forEach(r => {
            if (r.classId) {
                requestMap[r.classId.toString()] = r.status;
            }
        });

        const securedClasses = classes.map((c, index) => {
            const classObj = c.toObject();
            const effectiveNum = (c.classNumber !== undefined && c.classNumber !== null && !isNaN(Number(c.classNumber)))
                ? Number(c.classNumber)
                : (index + 1);

            classObj.classNumber = effectiveNum;
            classObj.globalIndex = effectiveNum;
            classObj.isIntro = false;
            classObj.accessStatus = requestMap[c._id.toString()] || 'Not Requested';

            if (isCoursePaused) {
                classObj.videoUrl = "";
                classObj.isLocked = true;
                classObj.isPaused = true;
                classObj.lockReason = "Classes are temporarily paused by admin.";
                return classObj;
            }

            const isApproved = classObj.accessStatus === 'Approved';
            if (!isApproved) {
                classObj.videoUrl = "";
                classObj.isLocked = true;
            } else {
                classObj.isLocked = false;
            }

            return classObj;
        });

        res.status(200).json({
            success: true,
            message: "Interview classes fetched successfully",
            totalCourses: securedClasses.length,
            courses: securedClasses
        });
    } catch (error) {
        console.error("GET INTERVIEW CLASSES ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Student: Securely fetch video URL (Only if month enrolled & access Approved)
 */
const getInterviewVideoUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const interviewClass = await InterviewClass.findById(id);
        if (!interviewClass) {
            return res.status(404).json({ success: false, message: "Interview class not found" });
        }

        const { is1MonthEnrolled, is2MonthEnrolled } = getUserEnrollmentInfo(user);
        const classMonth = String(interviewClass.duration || interviewClass.month).trim();

        if (classMonth === '1') {
            if (!is1MonthEnrolled && !is2MonthEnrolled) {
                return res.status(403).json({ success: false, message: "Access denied: Not enrolled in this month" });
            }
        } else if (classMonth === '2') {
            if (!is2MonthEnrolled) {
                return res.status(403).json({ success: false, message: "Access denied: Not enrolled in Month 2" });
            }
        } else {
            if (!is1MonthEnrolled && !is2MonthEnrolled) {
                return res.status(403).json({ success: false, message: "Access denied: Not enrolled" });
            }
        }

        const settings = await Settings.findOne();
        if (settings?.isCoursePaused) {
            return res.status(403).json({
                success: false,
                message: "Classes are temporarily paused by admin."
            });
        }

        // Check if access is approved
        const accessReq = await ClassAccessRequest.findOne({
            userId: user._id,
            classId: interviewClass._id,
            status: 'Approved'
        });

        if (!accessReq) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin approval required for this interview class."
            });
        }

        res.status(200).json({
            success: true,
            videoUrl: interviewClass.videoUrl
        });
    } catch (error) {
        console.error("GET INTERVIEW VIDEO URL ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Student: Request Grant Access for an Interview Class
 */
const requestInterviewClassAccess = async (req, res) => {
    try {
        const { courseId, classId, classNumber } = req.body;
        const userId = req.user.id;

        const targetClassId = classId || courseId;
        if (!targetClassId) {
            return res.status(400).json({ success: false, message: "classId or courseId is required" });
        }

        const interviewClass = await InterviewClass.findById(targetClassId);
        if (!interviewClass) {
            return res.status(404).json({ success: false, message: "Interview class not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { is1MonthEnrolled, is2MonthEnrolled } = getUserEnrollmentInfo(user);
        const classMonth = String(interviewClass.duration || interviewClass.month).trim();

        if (classMonth === '1') {
            if (!is1MonthEnrolled && !is2MonthEnrolled) {
                return res.status(403).json({ success: false, message: "You are not enrolled in Month 1." });
            }
        } else if (classMonth === '2') {
            if (!is2MonthEnrolled) {
                return res.status(403).json({ success: false, message: "You are not enrolled in Month 2." });
            }
        } else {
            if (!is1MonthEnrolled && !is2MonthEnrolled) {
                return res.status(403).json({ success: false, message: "No active enrollment found." });
            }
        }

        // Check for existing request
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

        const label = classNumber || `Interview Class ${interviewClass.classNumber || 1}`;

        const newRequest = await ClassAccessRequest.create({
            userId,
            courseId: interviewClass._id,
            classId: interviewClass._id,
            classNumber: label,
            status: 'Pending',
            requestedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Access requested successfully",
            request: newRequest
        });
    } catch (error) {
        console.error("REQUEST INTERVIEW CLASS ACCESS ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Student: Get status of a single interview class access request
 */
const getInterviewClassAccessStatus = async (req, res) => {
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

/**
 * Student: Get all interview class access statuses for user
 */
const getAllInterviewClassAccessStatuses = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await ClassAccessRequest.find({ userId });

        const statusMap = {};
        requests.forEach(r => {
            if (r.classId) {
                statusMap[r.classId.toString()] = r.status;
            }
        });

        return res.status(200).json({
            success: true,
            statuses: statusMap
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: Get all interview classes
 */
const getAdminInterviewClasses = async (req, res) => {
    try {
        const classes = await InterviewClass.find({}).sort({ classNumber: 1, createdAt: 1 });
        res.status(200).json({
            success: true,
            totalCourses: classes.length,
            courses: classes
        });
    } catch (error) {
        console.error("GET ADMIN INTERVIEW CLASSES ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Admin: Update an interview class
 */
const updateInterviewClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, teacherName, languageMedium, duration, videoUrl, month, classNumber } = req.body;

        const interviewClass = await InterviewClass.findById(id);
        if (!interviewClass) {
            return res.status(404).json({
                success: false,
                message: "Interview class not found"
            });
        }

        if (title !== undefined) interviewClass.title = title.trim();
        if (description !== undefined) interviewClass.description = description.trim();
        if (teacherName !== undefined) interviewClass.teacherName = teacherName.trim();
        if (languageMedium !== undefined) interviewClass.languageMedium = languageMedium.trim();
        if (duration !== undefined) interviewClass.duration = String(duration).trim();
        if (videoUrl !== undefined) interviewClass.videoUrl = videoUrl.trim();
        if (month !== undefined) interviewClass.month = Number(month);

        if (classNumber !== undefined && classNumber !== null && classNumber !== '') {
            interviewClass.classNumber = Number(classNumber);
        }

        await interviewClass.save();

        res.status(200).json({
            success: true,
            message: "Interview class updated successfully",
            interviewClass
        });
    } catch (error) {
        console.error("UPDATE INTERVIEW CLASS ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Admin: Delete an interview class
 */
const deleteInterviewClass = async (req, res) => {
    try {
        const { id } = req.params;
        const interviewClass = await InterviewClass.findById(id);

        if (!interviewClass) {
            return res.status(404).json({
                success: false,
                message: "Interview class not found"
            });
        }

        await InterviewClass.findByIdAndDelete(id);

        // Delete associated access requests
        await ClassAccessRequest.deleteMany({ classId: id });

        res.status(200).json({
            success: true,
            message: "Interview class deleted successfully"
        });
    } catch (error) {
        console.error("DELETE INTERVIEW CLASS ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createInterviewClass,
    getInterviewClasses,
    getInterviewVideoUrl,
    requestInterviewClassAccess,
    getInterviewClassAccessStatus,
    getAllInterviewClassAccessStatuses,
    getAdminInterviewClasses,
    updateInterviewClass,
    deleteInterviewClass
};
