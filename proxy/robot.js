
var util = require('util');
var CommonProxy = require('./common');

function RobotProxy () {
  CommonProxy.call(this);
}
util.inherits(RobotProxy, CommonProxy);

RobotProxy.prototype._init = function (exports) {
  exports.start();
}