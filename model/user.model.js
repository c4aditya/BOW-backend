const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    enrolledMonth: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    approvedAt: {
        type: Date
    },
    watchedVideos: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
        default: []
    },
    hasLoggedInAfterApproval: {
        type: Boolean,
        default: false
    },
    lastWatchedClass: {
        type: Number,
        default: null
    },
    lastApprovedClass: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
