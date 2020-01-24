const express = require('express');
const router = express.Router();

router.get('/:fileName', function(req, res, next) {
  res.send(`respond with status of ${req.params.fileName}`);
});

module.exports = router;
