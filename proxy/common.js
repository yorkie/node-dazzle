
var path = require('path');
var util = require('util');

process.on('uncaughtException', function (e) {
  console.log(e.stack);
  process.exit(0);
})

/*
 * This proxy is for common app
 */
function CommonProxy () {
  process.title = 'Dazzle Worker';
  process.on('message', this._onHandler.bind(this));
  console.log(process.env.NODE_PATH)
}

CommonProxy.prototype._onHandler = function (env, socket) {
  if (env.cmd == 'coffee') require('coffee-script');

  var scriptPath = path.resolve(process.cwd(), env.path);
  var exports = require(scriptPath);
  this._init(exports);
}

CommonProxy.prototype._init = function (exports) {
  //exports.start.call(this);
}


// Exports
if (require.main == module)
  new CommonProxy();
else
  module.exports = CommonProxy;