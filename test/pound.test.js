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

  defineAsset: function(t) {
    defineAsset({ name: 'app'}, {
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
  },

  defineAssetExtend: function(t) {
    defineAsset({ name: 'app'}, {
      js: ['$js/test', '$js/test1', '//domain.com/res.js', '$js/test2', {ns: {}}],
      css: [ undefined, '$css/ok']
    });

    defineAsset({ name: 'app_pro', extend:'app'}, {
      js: ['$js/pro_features', '$js/test1']
    });

    t.deepEqual(this.P.assets.js.app_pro, [ '$js/test', '$js/test1', '//domain.com/res.js', '$js/test2', { ns: {} }, '$js/pro_features' ]);

    t.done();
  }
};
