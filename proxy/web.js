

var util = require('util');
var path = require('path');
var http = require('http');
var yaml = require('js-yaml');
var express = require('express');
var CommonProxy = require('./common');


function WebProxy () {
  CommonProxy.call(this);
  var app = this.app = express();
  app.configure(function () {
    app.use(express.static(path.join(process.cwd(), "./assets")));
    app.use(express.bodyParser());
    app.set('view engine', 'jade');
    app.set('views', process.cwd()+'/views');
  });
}
util.inherits(WebProxy, CommonProxy);

/*
 * Init script
 */
WebProxy.prototype._init = function (exports) {
  this.port = exports.port;
  this.setRoutes();
  this.start();
}

WebProxy.prototype.setRoutes = function () {
  var conf = this.conf = require(process.cwd()+'/routes.json');
  for (var method in conf)
    this.binding(method, conf[method]);
}

WebProxy.prototype.binding = function (method, routes) {
  if (['get', 'post', 'delete', 'head', 'put'].indexOf(method) == -1)
    throw new Error(util.format('Unsupported method %s', method));

  var app = this.app;
  routes.forEach(function (item) {
    var route = Object.keys(item)[0];
    var _ = item[route].split('#');
    app[method](route, function (req, res, next) {
      res.name = _[0];
      res.method = _[1];
      res.renderView = render(res);
      var logicModule = util.format('%s/controllers/%s', process.cwd(), _[0]);
      require(logicModule)[_[1]](req, res, next);
    });
  });

  function render (res) {
    var view = util.format('%s/%s', res.name, res.method);
    return function (data) {
      var renderData = {
        title: util.format('%s - %s', res.name, res.method),
        controller: res.name,
        method: res.method
      };
      for (var key in data||{})
        renderData[key] = data[key];

      res.status(200);
      res.render(view, renderData);
    }
  }
}

WebProxy.prototype.start = function () {
  var server = http.createServer(this.app);
  server.listen(this.port);
}

// Exports
if (require.main == module)
  new WebProxy();
else
  throw new Error('This proxy do not support inherits, please use it directly.');
