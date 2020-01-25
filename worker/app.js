const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { ContainerClient } = require('@azure/storage-blob');
const { EventHubConsumerClient } = require('@azure/event-hubs');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const containerClient = new ContainerClient(process.env['BlobConnectionString'], process.env['BlobContainer']);
const consumerClient = new EventHubConsumerClient(EventHubConsumerClient.defaultConsumerGroupName, process.env['EventHubsConnectionString']);
consumerClient.subscribe({
  processEvents: async (events, context) => {
    for(const event of events) {
      try {
        const filename = event.body;
        const blobClient = await containerClient.getBlobClient(filename);
        const buffer = await blobClient.downloadToBuffer();
        console.log(`Processing ${filename}`);
        let index = -1;
        let count = 0;
        do {
          count++;
          index = buffer.indexOf('\n', index+1)
        } while (index > -1);

        await blobClient.setMetadata({
          "newlinecount": String(count)
        });
        
        console.log(`${filename} had ${count} lines`);
      } finally {
        await context.updateCheckpoint(event);
      }
    }
  },
  processError: (err, context) => {
    console.error(err);
  }
});

app.get('/', function(req, res, next) {
  res.send("This is a worker app");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
