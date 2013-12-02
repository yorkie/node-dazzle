
var fs = require('fs');
var net = require('net');
var util = require('util');
var yaml = require('js-yaml');

var worker = require('./worker');

module.exports = Launcher;

function Launcher (option) {

  /*
   * the root path
   * for example: /opt/Beanstalk
   */
  this._root = option.root || 'required';

  /*
   * the config file type
   */
  this._configType = option.configType || 'json';

  /*
   * slient config
   */
  this._slient = option.slient || false;
  
  /*
   * configs map to workers.
   */
  this._configs = {};
  
  /*
   * the all started workers in it.
   */
  this._workers = [];

  //
  // check required
  if ([this.root, this.path].indexOf('required') != -1)
    throw new Error('Should provide the `root` and `path` arguments');

  //
  // set process
  process.title = 'Dazzle Launcher';
  process.env.NODE_PATH += ':'+ util.format('%s/lib', option.root);

  this.load();
  this.listen();
}

/*
 * Start a service
 */
Launcher.prototype.start = function (name, argv, env) {
  var list = this._configs[name];
  var argv = argv || [];
  var env = process.env.VPS_ENV = env || 'local';

  if (!list)
    throw new Error('cannot find the process config: '+name);

  for (var i in list) {
    var item = list[i];
    var selected = item.env.indexOf(env);
    if (selected == -1)
      continue;
    this._workers.push(
      worker.createOne(name, this, item, []));
  }
}

/*
 * Kill a process by pid
 */
Launcher.prototype.stop = function (pid) {
  this._workers.filter(function (worker) {
    return !pid || pid === worker.pid || arguments[0] === worker.name
  }).forEach(function (worker) {
    return worker.stop(0);
  });
}

/*
 * list all process
 */
Launcher.prototype.list = function () {
  var result = [];
  this._workers.forEach(function (worker) {
    result.push({
      name: worker.name,
      option: worker.option,
      pid: worker.pid
    })
  });
  return result;
}

/*
 * restart
 * pid/name
 */
Launcher.prototype.restart = function () {
  var first = arguments[0];
  this._workers.filter(function (worker) {
    return !first || ([worker.pid, worker.name].indexOf(first) !== -1)
  }).forEach(function (worker) {
    return worker.stop();
  });
}

/*
 * load configuration
 */
Launcher.prototype.load = function () {
  var self = this;
  var configPath;
  fs.readdirSync(this._root + '/services').forEach(function (name) {
    configPath = util.format('%s/services/%s/service.%s', 
      self._root, name, self._configType);
    try {
      self._configs[name] = require(configPath);
    } catch (e) {
      console.warn(e);
    };
  });
}

/*
 * reload the configuration and sync it to related process...
 */
Launcher.prototype.reload = function (filter) {
  this.load();
}

/*
 * log data....
 */
Launcher.prototype._log = function (data) {
  var catalog = data.catalog;
  var level   = data.level;
  var message = data.message;
  console.log(message);
}

/*
 * open the port for others connect to this
 */
Launcher.prototype.listen = function (port) {
  var self = this;
  var server = net.createServer(function (socket) {
    socket.setEncoding('utf8');
    socket.on('data', function (chunk) {
      var hasError = true;
      var response = {};
      var message  = {};
      try {
        message = JSON.parse(chunk.toString());
        hasError = false;
      } catch (e) {
        response.error = e;
        socket.end(JSON.stringify(response));
      }
      if (!hasError) {
        // response
        var caller = self[message.command];
        if (caller && typeof caller == 'function') {
          try {
            response.result = caller.apply(self, message.args);
            response.error = null;
            socket.end(JSON.stringify(response));
          } catch (e) {
            response.error = e.stack;
            socket.end(JSON.stringify(response));
          };
        } else {
          response.error = 'cannot find the function: '+ message.command;
          socket.end(JSON.stringify(response));
        }
      }
    });
  });
  server.listen(port = (port||8015), function () {
    console.log('laucher up:' + port);
  });
}



