const File = require('../models/File');
const { web3, contract } = require('../config/web3');
const { hexlify } = require('ethers');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');



const upload = multer({ dest: 'uploads/' });
exports.uploadDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      const data = fs.readFileSync(req.file.path);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(process.env.JWT_SECRET),
        Buffer.alloc(16, 0)
      );
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      fs.writeFileSync(req.file.path + '.enc', encrypted);
      fs.unlinkSync(req.file.path);

      // Ensure to prefix '0x' and convert to bytes32 format for blockchain
      const fileHashHex = '0x' + crypto.createHash('sha256').update(encrypted).digest('hex');
      const mimeType = req.file.mimetype; const fileSize = req.file.size;
      const file = new File({
        user: req.user.id,
        filename: req.file.filename + '.enc',
        originalname: req.file.originalname,
        fileHash: fileHashHex,
        encryptedFilename: req.file.filename + '.enc',
        fileType: mimeType,
        fileSize: fileSize,
      });

      await file.save();

      // Blockchain event logging - use an unlocked account
      const accounts = await web3.eth.getAccounts();
      await contract.methods.logUpload(fileHashHex).send({ from: accounts[0] });

      res.json({ message: 'Uploaded, encrypted & logged on blockchain', fileId: file._id });
    } catch (err) {
      console.error('uploadDocument error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
];





exports.getMyDocuments = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).select('-__v');
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

const transporter = require('../config/nodemailer');
exports.shareFile = async (req, res) => {
  try {
    const { expiry, accessType, allowedUsers } = req.body;
    const { id: fileId } = req.params;

    // Find file
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Check ownership
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ Handle expiry safely
    let expiryDate = null;
    if (expiry && expiry !== 'null' && expiry !== '') {
      expiryDate = new Date(expiry);
      if (isNaN(expiryDate.getTime())) expiryDate = null; // fallback in case invalid
    }

    // Prepare JWT payload
    const tokenPayload = {
      fileId,
      expiry: expiryDate ? expiryDate.toISOString() : null,
      accessType,
      allowedUsers: allowedUsers || [],
    };

    // Generate JWT token (string)
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET);

    // Push share link metadata to DB
    file.sharedLinks.push({
      token: accessToken,
      createdAt: new Date(),
      type: accessType, // "restricted" or "public"
      allowedUsers,
      expiresAt: expiryDate, // ✅ Can be null for permanent
      sharedBy: req.user.email,
    });

    // Convert JWT token to sha256 hash for blockchain logging
    const tokenHashBuffer = crypto.createHash('sha256').update(accessToken).digest();
    const tokenHash = hexlify(tokenHashBuffer);

    // Ensure fileHash is properly 0x-prefixed
    const fileHash = file.fileHash.startsWith('0x') ? file.fileHash : '0x' + file.fileHash;

    // ✅ Blockchain logging: handle permanent (no expiry) safely
    const expiryTimestamp = expiryDate ? Math.floor(expiryDate.getTime() / 1000) : 0; // 0 means permanent

    await contract.methods
      .logShare(tokenHash, fileHash, expiryTimestamp)
      .send({ from: (await web3.eth.getAccounts())[0] });

    // Also add share log entry in DB
    file.shareLogs.push({
      time: new Date(),
      sharedWith: allowedUsers?.join(', ') || '',
      sharedBy: req.user.email,
      linkType: accessType,
    });

    await file.save();

    // --------- Email Notifications ----------
    let senderIdentity = req.user.email;
    const senderUser = await User.findById(req.user.id);
    if (senderUser && senderUser.username) {
      senderIdentity = senderUser.username + ` (${senderUser.email})`;
    }

    for (const receiverEmail of allowedUsers || []) {
      const toUser = await User.findOne({ email: receiverEmail });

      const mailOptions = {
        from: `DocShield <${process.env.NOTIFY_EMAIL}>`,
        to: receiverEmail,
        subject: `A file has been shared with you on DocShield`,
        text: `${senderIdentity} has shared a file "${file.originalname}" with you on DocShield!

Access Link: http://localhost:3000/login

(Please log in to DocShield to view the file.)`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Email notify error for', receiverEmail, err);
        else console.log('Notified:', receiverEmail, info.response);
      });
    }
    // ----------------------------------------

    // Return sharing link
    res.json({ link: `http://localhost:5000/api/files/access/${accessToken}` });
  } catch (err) {
    console.error('shareFile error:', err);
    res.status(500).json({ message: 'Error sharing file' });
  }
};


exports.accessFile = async (req, res) => {
  try {
    const { token } = req.params;

    // Decode token and validate access
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fileId, expiry, allowedUsers, accessType } = decoded;

    // ✅ Only check expiry if it exists
    if (expiry && expiry !== null && new Date() > new Date(expiry)) {
      return res.status(410).json({ message: 'File expired' });
    }

    const file = await File.findById(fileId)
      .select('-sharedLinks -shareLogs -accessLogs -__v');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    let accessedBy;
    if (accessType === 'restricted') {
      const { email } = req.query;
      if (!email || !allowedUsers.includes(email)) {
        return res.status(403).json({ message: 'You are not allowed to access this file' });
      }
      accessedBy = email;
    } else {
      accessedBy = req.query.email || 'public user';
    }

    // Log access in MongoDB
    await File.findByIdAndUpdate(fileId, {
      $push: { accessLogs: { time: new Date(), accessedBy } }
    });

    // Blockchain access log (async)
    const tokenHashBuffer = crypto.createHash('sha256').update(token).digest();
    const tokenHash = hexlify(tokenHashBuffer);
    const accounts = await web3.eth.getAccounts();

    contract.methods.logAccess(tokenHash)
      .send({ from: accounts[0] })
      .then(() => console.log('Blockchain access logged for token:', tokenHash))
      .catch(err => console.error('Blockchain access log error:', err));

    // ✅ Respond with file data if valid
    res.json(file);

  } catch (err) {
    console.error('accessFile error:', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};




exports.getLogs = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Convert raw logs into readable strings
    const logs = file.accessLogs.map(log => {
      const date = new Date(log.time);
      const formattedDate = date.toLocaleDateString('en-GB'); // 12/08/2025
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${log.accessedBy} accessed your file on ${formattedDate} at ${formattedTime}`;
    });

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

exports.sharedWithMe = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const files = await File.find({
      'sharedLinks.allowedUsers': userEmail
    }).select('-__v');

    // For every matching file, also attach the correct sharedBy for the matching link
    const result = files.map(file => {
      // Find the link that matches the current user
      const matchingLink = file.sharedLinks.find(link => (link.allowedUsers || []).includes(userEmail));
      return {
        _id: file._id,
        originalname: file.originalname,
        sharedLinks: file.sharedLinks,
        sharedBy: matchingLink && matchingLink.sharedBy ? matchingLink.sharedBy : 'Unknown'
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch files shared with you' });
  }
};



exports.revokeShareLink = async (req, res) => {
  try {
    const { fileId, token } = req.params;

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Check ownership
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove shared link by token
    const initialCount = file.sharedLinks.length;
    file.sharedLinks = file.sharedLinks.filter(link => link.token !== token);

    if (file.sharedLinks.length === initialCount) {
      return res.status(404).json({ message: 'Shared link not found' });
    }

    await file.save();
    res.json({ message: 'Shared link revoked and removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error revoking share link' });
  }
};
exports.downloadDecryptedMyDocument = async (req, res) => {
  try {
    const { id } = req.params; // file ID

    const file = await File.findById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Verify that the requesting user owns the file
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Path to encrypted file
    const encryptedFilePath = path.join(__dirname, '../uploads', file.encryptedFilename);
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ message: 'Encrypted file missing on server' });
    }

    // Read encrypted file data
    const encryptedData = fs.readFileSync(encryptedFilePath);

    // Decrypt with AES-256-CBC using your JWT_SECRET as key
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.JWT_SECRET),
      Buffer.alloc(16, 0)
    );

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // Set headers and send decrypted file
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    res.send(decrypted);
  } catch (err) {
    console.error('Error downloading decrypted document:', err);
    res.status(500).json({ message: 'Error downloading document' });
  }
};
const User = require('../models/User');

exports.getAllShareHistories = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id });

    // Get all unique allowed user emails to fetch usernames in batch
    const allEmails = new Set();
    files.forEach(file => {
      file.sharedLinks.forEach(link => {
        (link.allowedUsers || []).forEach(email => allEmails.add(email));
      });
    });

    // Fetch users once
    const users = await User.find({ email: { $in: Array.from(allEmails) } });

    // Map email to username
    const emailToUsername = {};
    users.forEach(user => {
      emailToUsername[user.email] = user.username; // Adjust field name if needed
    });

    const allHistories = files.map(file => {
      return {
        fileId: file._id,
        originalname: file.originalname,
        shareHistory: file.sharedLinks.map(link => ({
          token: link.token,
          sharedAt: link.createdAt,
          accessType: link.type,
          allowedUsers: (link.allowedUsers || []).map(email => emailToUsername[email] || email),
          expiresAt: link.expiresAt,
          accessLogs: link.accessLogs || []
        }))
      };
    });

    res.json(allHistories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch share histories' });
  }
};





function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case '.mp3': return 'audio/mpeg';
    case '.mp4': return 'video/mp4';
    case '.pdf': return 'application/pdf';
    case '.jpg':
    case '.jpeg':
    case '.png': return `image/${ext.slice(1)}`;
    case '.txt': return 'text/plain';
    case '.doc': return 'application/msword';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return 'application/octet-stream';
  }
}

exports.downloadDecryptedFile = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) return res.status(400).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Only check expiry if present
    if (decoded.expiry && decoded.expiry !== null && new Date() > new Date(decoded.expiry)) {
      return res.status(410).json({ message: 'File expired' });
    }

    const file = await File.findById(decoded.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(__dirname, '../uploads', file.encryptedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Encrypted file not found' });
    }

    // Decrypt file contents
    const encryptedData = fs.readFileSync(filePath);
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.JWT_SECRET),
      Buffer.alloc(16, 0)
    );

    const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // Detect and send MIME type
    const mimeType = getMimeType(file.originalname);
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.originalname}"`);

    res.send(decryptedBuffer);
  } catch (err) {
    console.error('downloadDecryptedFile error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(410).json({ message: 'File expired' });
    }
    res.status(500).json({ message: 'Failed to fetch file' });
  }
};



exports.deleteMyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);

    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delete physical file if it exists
    const filePath = path.join(__dirname, '../uploads', file.encryptedFilename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the file record
    await file.deleteOne();

    res.json({ message: 'Document deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting document' });
  }
};

const mime = require('mime');

exports.streamDecryptedFile = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const file = await File.findById(decoded.fileId);
    const filePath = path.join(__dirname, '../uploads', file.encryptedFilename);
    const mimeType = mime.getType(file.originalname) || 'application/octet-stream';

    if (!fs.existsSync(filePath)) return res.status(404).send('File missing');

    const encryptedStream = fs.createReadStream(filePath);
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.JWT_SECRET),
      Buffer.alloc(16, 0)
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalname}"`);
    encryptedStream.pipe(decipher).pipe(res);
  } catch (err) {
    console.log('Error serving file:', err);
    res.status(500).send('Error serving decrypted file');
  }
};



















exports.generateShareLink = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiryMinutes } = req.body;

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const expiresAt = new Date(Date.now() + expiryMinutes * 60000);
    const token = crypto.randomBytes(16).toString('hex');

    file.sharedLinks.push({ token, expiresAt });
    await file.save();

    res.json({ link: `http://localhost:5000/api/files/shared/${token}` });
  } catch (err) {
    res.status(500).json({ message: 'Error generating link' });
  }
};

exports.accessSharedFile = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) return res.status(400).json({ message: 'Missing token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or malformed token' });
    }

    const file = await File.findOne({ "sharedLinks.token": token });

    if (!file) return res.status(404).json({ message: 'Invalid or expired link' });

    const sharedLink = file.sharedLinks.find(link => link.token === token);

    if (new Date() > sharedLink.expiresAt) {
      return res.status(410).json({ message: 'File expired' });
    }

    // Log the access
    sharedLink.accessLogs.push({
      time: new Date(),
      ip: req.ip
    });
    await file.save();


    // Send file download response
    return res.download(
      path.join(__dirname, '../uploads', file.encryptedFilename),
      file.originalname + '.enc',
      (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).send('Error downloading file');
        }
      }
    );

  } catch (err) {
    console.error('accessSharedFile error:', err);
    res.status(500).json({ message: 'Error accessing file' });
  }
};




exports.getAccessLogs = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const logs = file.sharedLinks.flatMap(link =>
      link.accessLogs.map(log => ({
        token: link.token,
        accessedAt: log.time,
        ip: log.ip
      }))
    );

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

exports.shareDocument = exports.shareFile;
exports.accessDocument = exports.accessFile;
