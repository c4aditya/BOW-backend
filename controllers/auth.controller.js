const User = require('../model/user.model');
const AllowedUser = require('../model/allowedUser.model');
const Course = require('../model/course.model');
const Settings = require('../model/Seeting.model');
const ClassAccessRequest = require('../model/classAccessRequest.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendAccountApprovedEmail } = require('../utils/classApproveMailSend');

const generateToken = (res, payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'Aditya', { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return token;
};

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("ERROR: User already exists -", email);
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }

        // Check if email is pre-approved by admin
        const allowedUser = await AllowedUser.findOne({ email });
        console.log("ALLOWED USER CHECK:", allowedUser);
        console.log("SIGNUP EMAIL:", email);

        if (!allowedUser) {
            console.log("ERROR: Email not pre-approved -", email);
            return res.status(403).json({
                success: false,
                message: "You are not allowed to signup. Contact admin."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            status: 'pending'
        });

        const responseData = {
            success: true,
            message: 'Registration successful. Please wait for admin approval.',
            user: { id: user._id, name: user.name, email: user.email, status: user.status, role: user.role }
        };

        console.log("SUCCESS: User signed up -", email);
        res.status(201).json(responseData);
    } catch (error) {
        console.log("ERROR: Signup failed -", error.message);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log("ERROR: Invalid login attempt -", email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        if (user.status !== 'approved') {
            console.log("ERROR: Pending user login attempt -", email);
            return res.status(403).json({ 
                success: false,
                message: 'Wait for admin approval' 
            });
        }

        if (!user.hasLoggedInAfterApproval) {
            user.hasLoggedInAfterApproval = true;
            await user.save();
        }

        const token = generateToken(res, { userId: user._id, role: user.role });

        // Fetch courses based on user enrollment duration
        let courses;
        if (user.enrolledMonth === "1" || user.enrolledMonth === "1 month") {
            courses = await Course.find({ duration: "1" }).sort({ classNumber: 1, createdAt: 1 });
        } else if (user.enrolledMonth === "2" || user.enrolledMonth === "2 month" || user.enrolledMonth === "2 months") {
            courses = await Course.find({ duration: { $in: ["1", "2"] } }).sort({ classNumber: 1, createdAt: 1 });
        } else {
            courses = [];
        }

        const settings = await Settings.findOne();
        const isCoursePaused = settings?.isCoursePaused || false;

        const accessTime = new Date(user.approvedAt || user.createdAt).getTime();
        const securedCourses = courses.map((course, index) => {
            const unlockTime = accessTime + index * 12 * 60 * 60 * 1000;
            const isLocked = Date.now() < unlockTime;
            const courseObj = course.toObject();

            if (isCoursePaused) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.isPaused = true;
                courseObj.lockReason = "Classes are temporarily paused by admin.";
                return courseObj;
            }

            if (isLocked) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.unlockTime = unlockTime;
            } else {
                courseObj.isLocked = false;
                courseObj.unlockTime = unlockTime;
            }
            return courseObj;
        });

        const responseData = {
            success: true,
            message: 'Login successful',
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                status: user.status,
                enrolledMonth: user.enrolledMonth,
                approvedAt: user.approvedAt || user.createdAt,
                hasLoggedInAfterApproval: user.hasLoggedInAfterApproval
            },
            totalCourses: securedCourses.length,
            courses: securedCourses,
            token
        };

        console.log("USER LOGIN:", user.email);
        console.log("ENROLLMENT:", user.enrolledMonth);
        console.log("COURSES FOUND:", courses.length);
        res.status(200).json(responseData);
    } catch (error) {
        console.log("ERROR: Login failed -", error.message);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin976126';

        if (email === envAdminEmail && password === envAdminPassword) {
            const token = generateToken(res, { email, role: 'admin' });
            
            const responseData = {
                success: true,
                message: 'Admin login successful',
                user: { email, role: 'admin' },
                token
            };

            console.log("SUCCESS: Admin logged in -", email);
            return res.status(200).json(responseData);
        }

        console.log("ERROR: Invalid admin login attempt -", email);
        res.status(401).json({ 
            success: false,
            message: 'Invalid admin credentials' 
        });
    } catch (error) {
        console.log("ERROR: Admin login failed -", error.message);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const getPendingUsers = async (req, res) => {
    try {
        console.log("USER:", req.user);
        const pendingUsers = await User.find({ status: 'pending' }).select('-password');
        
        console.log("SUCCESS: Fetched pending users - Count:", pendingUsers.length);
        res.status(200).json({
            success: true,
            message: "Pending users fetched successfully",
            users: pendingUsers
        });
    } catch (error) {
        console.log("ERROR: Failed to fetch pending users -", error.message);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const getApprovedPendingLoginUsers = async (req, res) => {
    try {
        const users = await User.find({ status: 'approved', hasLoggedInAfterApproval: false })
            .sort({ approvedAt: -1 })
            .select('-password');
        
        console.log("SUCCESS: Fetched approved pending login users - Count:", users.length);
        res.status(200).json({
            success: true,
            message: "Approved pending login users fetched successfully",
            users
        });
    } catch (error) {
        console.log("ERROR: Failed to fetch approved pending login users -", error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const approveUser = async (req, res) => {
    try {
        console.log("USER:", req.user);
        const { id } = req.params;

        // Find user first to get email
        const userToApprove = await User.findById(id);
        if (!userToApprove) {
            console.log("ERROR: User not found for approval - ID:", id);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch enrolledMonth from AllowedUser collection
        const allowed = await AllowedUser.findOne({ email: userToApprove.email });
        const enrolledMonth = allowed ? allowed.enrolledMonth : "";

        const user = await User.findByIdAndUpdate(
            id, 
            { status: 'approved', enrolledMonth: enrolledMonth, approvedAt: new Date() }, 
            { new: true }
        ).select('-password');

        console.log("SUCCESS: User approved -", user.email, "Enrolled for:", user.enrolledMonth);

        // Send HTML Account Approval Email Notification
        try {
            if (user && user.email) {
                await sendAccountApprovedEmail({
                    userEmail: user.email,
                    userName: user.name
                });
            }
        } catch (emailErr) {
            console.error("[EMAIL ERROR] Failed to process account approval email dispatch:", emailErr);
        }

        res.status(200).json({ 
            success: true,
            message: 'User approved successfully', 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                enrolledMonth: user.enrolledMonth
            }
        });
    } catch (error) {
        console.log("ERROR: Approval failed -", error.message);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const logout = (req, res) => {
    res.clearCookie('token');
    console.log("SUCCESS: Logged out");
    res.status(200).json({ 
        success: true,
        message: 'Logged out successfully' 
    });
};

const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not logged in" });
        }

        // Handle Admin from Env
        if (req.user.role === 'admin') {
            return res.status(200).json({
                success: true,
                user: { email: req.user.email, role: 'admin' }
            });
        }

        // Handle regular User
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch courses based on user enrollment duration
        let courses;
        if (user.enrolledMonth === "1" || user.enrolledMonth === "1 month") {
            courses = await Course.find({ duration: "1" }).sort({ classNumber: 1, createdAt: 1 });
        } else if (user.enrolledMonth === "2" || user.enrolledMonth === "2 month" || user.enrolledMonth === "2 months") {
            courses = await Course.find({ duration: { $in: ["1", "2"] } }).sort({ classNumber: 1, createdAt: 1 });
        } else {
            courses = [];
        }

        const settings = await Settings.findOne();
        const isCoursePaused = settings?.isCoursePaused || false;

        const accessTime = new Date(user.approvedAt || user.createdAt).getTime();
        const securedCourses = courses.map((course, index) => {
            const unlockTime = accessTime + index * 12 * 60 * 60 * 1000;
            const isLocked = Date.now() < unlockTime;
            const courseObj = course.toObject();

            if (isCoursePaused) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.isPaused = true;
                courseObj.lockReason = "Classes are temporarily paused by admin.";
                return courseObj;
            }

            if (isLocked) {
                courseObj.videoUrl = "";
                courseObj.isLocked = true;
                courseObj.unlockTime = unlockTime;
            } else {
                courseObj.isLocked = false;
                courseObj.unlockTime = unlockTime;
            }
            return courseObj;
        });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                enrolledMonth: user.enrolledMonth,
                approvedAt: user.approvedAt || user.createdAt
            },
            courses: securedCourses
        });
    } catch (error) {
        console.log("GET ME ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ status: 'approved', hasLoggedInAfterApproval: { $ne: false } });
        const pendingUsers = await User.countDocuments({ status: 'pending' });
        const oneMonthUsers = await User.countDocuments({ enrolledMonth: { $in: ["1", "1 month"] }, status: 'approved', hasLoggedInAfterApproval: { $ne: false } });
        const twoMonthUsers = await User.countDocuments({ enrolledMonth: { $in: ["2", "2 months", "2 month"] }, status: 'approved', hasLoggedInAfterApproval: { $ne: false } });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                pendingUsers,
                oneMonthUsers,
                twoMonthUsers
            }
        });
    } catch (error) {
        console.log("STATS ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const query = { status: 'approved', hasLoggedInAfterApproval: { $ne: false } };
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .select("-password");

        const totalUsers = await User.countDocuments(query);
        const totalEnrolledStudents = await User.countDocuments(query);

        // Total courses
        const totalCourses = await Course.countDocuments();

        const allowedUsers = await AllowedUser.find({});
        const allowedPhoneMap = {};
        allowedUsers.forEach(au => {
            if (au.email && au.phone) {
                allowedPhoneMap[au.email.toLowerCase()] = au.phone;
            }
        });

        // Add progress info
        const updatedUsers = await Promise.all(users.map(async (user) => {

            const progressCount = user.watchedVideos?.length || 0;
            const completedClasses = progressCount;
            const lastWatchedClass = (user.lastWatchedClass !== undefined && user.lastWatchedClass !== null) ? user.lastWatchedClass : null;

            let currentClass;

            if (user.lastWatchedClass !== undefined && user.lastWatchedClass !== null) {
                currentClass = `${user.lastWatchedClass}`;
            } else if (progressCount >= totalCourses && totalCourses > 0) {
                currentClass = "Completed";
            } else {
                currentClass = "None";
            }

            // Get lastApprovedClass: check user.lastApprovedClass first, then fallback to most recent Approved ClassAccessRequest
            let lastApprovedClass = (user.lastApprovedClass !== undefined && user.lastApprovedClass !== null && user.lastApprovedClass !== '') ? user.lastApprovedClass : null;
            if (!lastApprovedClass) {
                const lastApprovedReq = await ClassAccessRequest.findOne({
                    userId: user._id,
                    status: 'Approved'
                })
                .populate('courseId', 'title')
                .sort({ approvedAt: -1, createdAt: -1 });

                if (lastApprovedReq) {
                    lastApprovedClass = lastApprovedReq.classNumber || lastApprovedReq.courseId?.title || null;
                }
            }

            const userObj = user.toObject();
            userObj.phone = user.phone || allowedPhoneMap[user.email.toLowerCase()] || '';

            return {
                ...userObj,
                progressCount,
                completedClasses,
                lastWatchedClass,
                lastApprovedClass,
                currentClass,
                totalCourses,
            };
        }));

        res.status(200).json({
            success: true,
            users: updatedUsers,
            totalUsers,
            totalEnrolledStudents,
        });

    } catch (error) {
        console.log("GET ALL USERS ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUserDuration = async (req, res) => {
    try {
        const { id } = req.params;
        const { enrolledMonth } = req.body;

        if (!enrolledMonth) {
            return res.status(400).json({ success: false, message: 'Enrolled month is required' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.enrolledMonth = enrolledMonth;
        await user.save();

        // Also update in AllowedUser if it exists
        await AllowedUser.findOneAndUpdate({ email: user.email }, { enrolledMonth });

        res.status(200).json({
            success: true,
            message: 'User course duration updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                enrolledMonth: user.enrolledMonth
            }
        });
    } catch (error) {
        console.log("UPDATE DURATION ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete from User collection
        await User.findByIdAndDelete(id);

        // Delete from AllowedUser pre-approval records
        await AllowedUser.findOneAndDelete({ email: user.email });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.log("DELETE USER ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log("ERROR: Forgot password - email not found:", email);
            return res.status(404).json({ 
                success: false, 
                message: 'User with this email does not exist' 
            });
        }

        console.log("SUCCESS: Forgot password email found -", email);
        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.log("ERROR: Forgot password failed -", error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and new password are required' 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log("ERROR: Reset password - user not found:", email);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        console.log("SUCCESS: Password reset successfully for -", email);
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.log("ERROR: Reset password failed -", error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const adminUpdateUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, enrolledMonth, lastWatchedClass, lastApprovedClass } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldEmail = user.email;

        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) user.email = email.toLowerCase().trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (enrolledMonth !== undefined) user.enrolledMonth = enrolledMonth;
        
        if (lastWatchedClass !== undefined && lastWatchedClass !== null && lastWatchedClass !== '') {
            const num = Number(lastWatchedClass);
            user.lastWatchedClass = isNaN(num) ? null : num;
        } else if (lastWatchedClass === null || lastWatchedClass === '' || lastWatchedClass === 'null') {
            user.lastWatchedClass = null;
        }

        if (lastApprovedClass !== undefined) {
            user.lastApprovedClass = lastApprovedClass;
        }

        await user.save();

        // Sync AllowedUser record if exists
        const allowedUpdate = {};
        if (name !== undefined) allowedUpdate.name = user.name;
        if (email !== undefined) allowedUpdate.email = user.email;
        if (phone !== undefined) allowedUpdate.phone = user.phone;
        if (enrolledMonth !== undefined) allowedUpdate.enrolledMonth = user.enrolledMonth;

        await AllowedUser.findOneAndUpdate({ email: oldEmail }, allowedUpdate);
        if (oldEmail !== user.email) {
            await AllowedUser.findOneAndUpdate({ email: user.email }, allowedUpdate);
        }

        res.status(200).json({
            success: true,
            message: 'User details updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                enrolledMonth: user.enrolledMonth,
                lastWatchedClass: user.lastWatchedClass,
                lastApprovedClass: user.lastApprovedClass
            }
        });
    } catch (error) {
        console.error("ADMIN UPDATE USER ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    signup,
    login,
    adminLogin,
    getMe,
    getAdminStats,
    getPendingUsers,
    getApprovedPendingLoginUsers,
    approveUser,
    logout,
    getAllUsers,
    updateUserDuration,
    adminUpdateUserDetails,
    deleteUser,
    forgotPassword,
    resetPassword
};
