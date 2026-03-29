const mongoose = require('mongoose');

// ✅ Access log schema — for when someone accesses/opens the file
const accessLogSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  ip: String,
  userEmail: String
}, { _id: false });

// ✅ Share log schema — for when the file is shared
const shareLogSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  sharedWith: String, // email or user ID of recipient
  sharedBy: String,   // email or user ID of the sharer
  linkType: String,   // e.g., 'public' or 'restricted'
  note: String        // optional remarks
}, { _id: false });

const sharedLinkSchema = new mongoose.Schema({
  token: String,  // 🔹 store unique token or JWT
  createdAt: { type: Date, default: Date.now },
  type: String,       // public/private/restricted
  allowedUsers: [String],
  sharedBy: String,
  expiresAt: Date,accessLogs: {
    type: [accessLogSchema],
    default: []  // Make sure default is empty array
  }
}, { _id: false });


// ✅ Main file schema
const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filename: String,
  originalname: String,
  fileHash: String,
  encryptedFilename: String,
fileType: { type: String },
  fileSize: { type: Number }, 

  downloadRequests: [{
  requestedBy: String,      // receiver's email
  requestedAt: Date,
  status: { type: String, default: 'pending' }, // 'pending', 'approved', 'declined'
}],

  // Current share links
  sharedLinks: [sharedLinkSchema],

  // Logs
  shareLogs: [shareLogSchema],  // 🔹 history of sharing events
  accessLogs: [accessLogSchema] // 🔹 history of accesses/downloads
},{ timestamps: true });

module.exports = mongoose.model('File', fileSchema);
