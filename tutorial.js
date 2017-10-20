"use strict";
var Bob = function() {}

Bob.prototype.hey = function (text) {
  return "Whatever";
}

module.exports = new Bob();

// another file
var Bob = require('./bob');
Bob.hey('text');