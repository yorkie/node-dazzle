
var util = require('util');
var path = require('path');
var fork = require('child_process').fork;

var Stream = require('stream').Stream;
var EventEmitter = require('events').EventEmitter;


exports.createOne = function (name, root, option, args) {
  var worker = new Worker(name, root, option);
  worker.start(args);
  return worker;
}

function Worker (name, root, option) {
  EventEmitter(this);

  this.name = name;
  this.root = root;
  this.option = option || {};
  this.starter = path.resolve(__dirname, 
    util.format('./proxy/%s.js', option.type || 'common'));
  this.pid = null;
  this._child = null;
}
util.inherits(Worker, EventEmitter);

Worker.prototype.start = function (args) {
  var child = this._child = fork(this.starter, args, {
    env: process.env,
    cwd: path.resolve(__dirname, '../../services', this.name),
    encoding: 'utf8',
    execArgv: ['--nouse-idle-notification','--max-old-space-size=300'],
    silent: false
  });
  this.pid = this._child.pid;
  this._child.send(this.option);
  this._child.on('message', this._onHandler.bind(this));
}

Worker.prototype.stop = function (signal) {
  this._child.kill(signal);
}

Worker.prototype.restart = function () {
  // TODO
}

Worker.prototype.reload = function () {
  // TODO
}

Worker.prototype.procline = function (message) {
  process.title = message;
}

Worker.prototype._onHandler = function (message) {
  if (!message.type)
    throw new Error('Unsupport child running...');

  var func = this.root['_'+message.type];
  if (func == undefined)
    throw new Error('Unknown function(' +message.type+ ') for this request from child process.');
  func(message.data);
}

