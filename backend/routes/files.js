const express = require('express');
const router = express.Router();
const passport = require('passport');
const fileController = require('../controllers/fileController');

console.log(fileController);


router.post('/upload', passport.authenticate('jwt', { session: false }), fileController.uploadDocument);
router.get('/mydocs', passport.authenticate('jwt', { session: false }), fileController.getMyDocuments);
router.post('/share/:id', passport.authenticate('jwt', { session: false }), fileController.shareFile);
router.get('/access/:token', fileController.accessFile);
router.get('/sharedwithme', passport.authenticate('jwt', { session: false }), fileController.sharedWithMe);
router.get('/logs/:id', passport.authenticate('jwt', { session: false }), fileController.getLogs);
router.post('/generate-link/:fileId', passport.authenticate('jwt', { session: false }), fileController.generateShareLink);
router.get('/download-decrypted/:token', fileController.downloadDecryptedFile);
router.get('/mydocs/download/:id', passport.authenticate('jwt', { session: false }), fileController.downloadDecryptedMyDocument);
router.get(
  '/share-history',
  passport.authenticate('jwt', { session: false }),
  fileController.getAllShareHistories
);
router.delete(
  '/mydocs/:id',
  passport.authenticate('jwt', { session: false }),
  fileController.deleteMyDocument
);

router.delete('/share/:fileId/:token', passport.authenticate('jwt', { session: false }), fileController.revokeShareLink);
module.exports = router;
