var pound = require('../');
var defineAsset = null;

module.exports = {
  setUp: function(callback) {
    this.P = pound.create();
    defineAsset = this.P.defineAsset;
    callback();
  },

  tearDown: function(callback) {
    callback();
  },

  precompile: function(t) {
    defineAsset({ name: 'app'}, {
      js: [__dirname+'/precompile.test.js',
           __dirname+'/pound.test.js']
    });

    t.doesNotThrow(function(){
      this.P.precompile();
    }.bind(this));

    t.done();
  }
};
