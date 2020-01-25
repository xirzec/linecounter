const express = require('express');
const router = express.Router();

router.get('/:fileName', async function(req, res, next) {
  const blobClient = req.app.locals.containerClient.getBlobClient(req.params.fileName);
  try {
    const props = await blobClient.getProperties();
    res.send(props.metadata["newlinecount"] || "Unknown");
  } catch(e) {
    res.sendStatus(500);
  }
});

module.exports = router;
