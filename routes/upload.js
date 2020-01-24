const express = require('express');
const busboy = require('busboy');
const router = express.Router();

router.post('/', function(req, res, next) {
  const bb = new busboy({headers: req.headers});
  const fileList = [];
  const pendingUploads = [];
  bb.on('file', function(fieldname, file, filename, encoding, mimetype) {
    const blobClient = req.app.locals.containerClient.getBlockBlobClient(filename);
    pendingUploads.push(blobClient.uploadStream(file));
    fileList.push(filename);
  });
  bb.on('finish', async function() {
    await Promise.all(pendingUploads);
    res.render('index', { title: 'Index after Upload', files: fileList });
  });
  req.pipe(bb);
});

module.exports = router;