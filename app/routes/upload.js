const express = require('express');
const busboy = require('busboy');
const router = express.Router();

router.post('/', function(req, res, next) {
  const bb = new busboy({headers: req.headers});
  const fileList = [];
  const pendingPromises = [];
  bb.on('file', function(fieldname, file, filename, encoding, mimetype) {
    pendingPromises.push(uploadFile(req, file, filename));
    fileList.push(filename);
  });
  bb.on('finish', async function() {
    await Promise.all(pendingPromises);
    res.render('index', { title: 'Index after Upload', files: fileList });
  });
  req.pipe(bb);
});

async function uploadFile(req, file, filename) {
  const blobClient = req.app.locals.containerClient.getBlockBlobClient(filename);
  await blobClient.uploadStream(file);
  const producerClient = req.app.locals.producerClient;
  const batch = await producerClient.createBatch();
  batch.tryAdd({ body: filename});
  await producerClient.sendBatch(batch);
}

module.exports = router;