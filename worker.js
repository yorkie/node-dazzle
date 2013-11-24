
var util = require('util');
var path = require('path');
var fork = require('child_process').fork;

var Stream = require('stream').Stream;
var EventEmitter = require('events').EventEmitter;


exports.createOne = function (name, option, args) {
  var worker = new Worker(name, option);
  worker.start(args);
}

function Worker (name, option) {
  EventEmitter(this);

  this.name = name;
  this.option = option || {};
  this.starter = path.resolve(__dirname, 
    util.format('./ports/%s.js', option.type || 'common'));
  this.pid = null;
  this._child = null;
}
util.inherits(Worker, EventEmitter);

Worker.prototype.start = function (args) {
  process.env._Dazzle = this.option || {};
  this._child = fork(this.starter, args, {
    env: process.env,
    cwd: process.cwd(),
    encoding: 'utf8',
    silent: false
  });
  this.pid = this._child.pid;
}

Worker.prototype.stop = function (signal) {
  // TODO
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

