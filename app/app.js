const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { ContainerClient } = require('@azure/storage-blob');
const { EventHubProducerClient } = require('@azure/event-hubs');

const indexRouter = require('./routes/index');
const statusRouter = require('./routes/status');
const uploadRouter = require('./routes/upload');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const containerClient = new ContainerClient(process.env['BlobConnectionString'], process.env['BlobContainer']);
app.locals.containerClient = containerClient;

const producerClient = new EventHubProducerClient(process.env['EventHubsConnectionString']);
app.locals.producerClient = producerClient;

app.use('/', indexRouter);
app.use('/status', statusRouter);
app.use('/', uploadRouter);


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
