
var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function DazzleCLI (port) {
  EventEmitter.call(this);
  
  this.port = port || 8015;
  this._connection = null;
  this._connected = null;
  this._response = null;
  this._currentHint = null;
}
util.inherits(DazzleCLI, EventEmitter);


DazzleCLI.prototype.connect = function () {
  this._connection = net.connect(this.port, '127.0.0.1', this._onConnect.bind(this));
  this._connection.setEncoding('utf8');
  this._connection.on('error', this._onError.bind(this));
  this._connection.on('end', this._onEnd.bind(this));
  this._connection.on('data', this._onData.bind(this));
}

DazzleCLI.prototype._onConnect = function () {
  this._connected = true;
  this.emit('ready');
}

DazzleCLI.prototype._onError = function (err) {
  this._connected = false;
  this.emit('error', err);
}

DazzleCLI.prototype._onEnd = function () {
  // TODO
}

DazzleCLI.prototype._onData = function (chunk) {
  this._response = JSON.parse(chunk);
}

DazzleCLI.prototype._sendCommand = function (command, args, callback) {
  this._connection.write(JSON.stringify({
    command:command,
    args:args2arr(args)
  }));
  this._connection.once('data', function (chunk) {
    if (callback && typeof callback === 'function') {
      var message = JSON.parse(chunk);
      callback.call(this, message.error, message.result);
    };
  }.bind(this));

  function args2arr (args) {
    return Array.apply(this, args);
  }
}

DazzleCLI.prototype.start = function (name, argv, env) {
  this._sendCommand('start', arguments, function (err, result) {
    if (err)
      console.error(err);
    else
      console.log(util.format('start %s, successfully!', name));
  });
}

DazzleCLI.prototype.stop = function (name) {
  this._sendCommand('stop', [name], function (err, result) {
    console.log(arguments);
  })
}

DazzleCLI.prototype.list = function () {
  this._sendCommand('list', [], function (err, procs) {
    console.log(JSON.stringify(procs, null, 2));
  })
}

module.exports = DazzleCLI;