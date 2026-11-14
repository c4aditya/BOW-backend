const mongoose = require('mongoose');

const classAccessRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    classNumber: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.Mixed
    },
    rejectedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// Prevent duplicate Pending requests for same user and class
classAccessRequestSchema.index({ userId: 1, classId: 1, status: 1 });

module.exports = mongoose.model('ClassAccessRequest', classAccessRequestSchema);
