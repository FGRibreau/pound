var pound = require('../');
var asset = null;

module.exports = {
  setUp: function(callback) {
    this.P = pound.create();
    asset = this.P.defineAsset;
    callback();
  },

  tearDown: function(callback) {
    callback();
  },

  defineAsset: function(t) {
    asset('app', {
      js: ['$js/test', '$js/test1', '//domain.com/res.js', '$js/test2', {ns: {}}],
      css: [ undefined, '$css/ok']
    });

    t.deepEqual(this.P.assets, {
      js: {
        app: ['$js/test', '$js/test1', '//domain.com/res.js', '$js/test2', {ns: {}}]
      },
      css: {
        app: ['$css/ok']
      }
    });

    t.done();
  }
};
