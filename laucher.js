
var fs = require('fs');
var net = require('net');
var util = require('util');
var yaml = require('js-yaml');

var worker = require('./worker');

module.exports = Launcher;

function Launcher (option) {

  process.title = 'Dazzle Launcher';

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

  this.load();
  this.listen();
}

/*
 * Start a service
 */
Launcher.prototype.start = function (name, argv, env) {
  var list = this._configs[name];
  var argv = argv || [];
  var env = env || 'local';
  for (var i in list) {
    var item = list[i];
    var selected = item.env.indexOf(env);
    if (selected == -1)
      continue;
    this._workers.push(
      worker.createOne(name, item, []));
  }
}

/*
 * Kill a process by pid
 */
Launcher.prototype.kill = function (pid) {
  this._workers.filter(function (worker) {
    return !pid || pid === worker.pid
  }).forEach(function (worker) {
    return worker.stop();
  });
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
 * open the port for others connect to this
 */
Launcher.prototype.listen = function (port) {
  var server = net.createServer(function (socket) {
    //socket.pipe(null);
  });
  server.listen(port = (port||8015), function () {
    console.log('laucher up:' + port);
  });
}



