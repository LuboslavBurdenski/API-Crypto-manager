const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const positionSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    coinId: {
        type: String,
        required: true
    },
    sum: {
        type: Number,
        required: true
    },
    entry: {
        type: Number,
        required: true
    },
    shares: {
        type: Number
    },  
    currentPrice: {
        type: Number
    },
    prfLoss: {
        type: Number
    },
    prfLossPerCent: {
        type: Number,
    },
    changeIn24h:{
        type: Number,
    },
    target: {
        type: Number,
        
    },
    stop: {
        type: Number,
       
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: 500,
    },
    creator: {
        type: ObjectId,
        ref: "User"
    },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Position', positionSchema);
