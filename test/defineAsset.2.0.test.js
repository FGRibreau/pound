var pound = require('../');
var bundle = null;

module.exports = {
  setUp: function(callback) {
    this.P = pound.create({publicDir: "/public", staticUrlRoot:"/"});
    bundle = this.P.defineAsset;
    callback();
  },

  tearDown: function(callback) {
    callback();
  },

  'defineAsset public by default': function(t) {
    bundle('app', {
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

  'defineAsset (everything private)':function (t){
    bundle('app',{
      private:{
        js: ['$js/test', '$js/test1', '//domain.com/res.js', '$js/test2', {ns: {}}],
        css: [ undefined, '$css/ok']
      }
    });

    t.deepEqual(this.P.assets, {
      js:  {app: [ '$js/test','$js/test1','//domain.com/res.js','$js/test2',{ ns: {} } ] },
      css: {app: [ '$css/ok' ] }
    });

    t.done();
  },

  'defineAsset (public & private)': function(t){
    bundle('app',{
      public:{
        js: ['$js/app_public'],
        css: ['$css/app_public']
      },

      private:{
        js:['$js/app_private']
      }
    });

    t.deepEqual(this.P.assets, {
      js: { app: [ '$js/app_public', '$js/app_private' ] },
      css: { app: [ '$css/app_public' ] }
    });

    t.done();
  },

  'defineAsset inheritance (everything private)':function (t){
    bundle('app',{
      private:{
        js: ['$js/a'],
        css: ['$css/b']
      }
    });

    bundle({name:'app_premium', extend:'app'},{
      private:{
        js: ['$js/c'],
        css: ['$css/d']
      }
    });

    t.deepEqual(this.P.assets, {
      js: { app: [ '$js/a' ], app_premium: [ '$js/c' ] },
      css: { app: [ '$css/b' ], app_premium: [ '$css/d' ]
    } });

    t.done();
  },

  defineAsset_inheritance: function(t) {
    // MOTHERFUCKING AWESOME HIGH-LEVEL ASSET MANAGEMENT
    bundle('app',{
      public:{
        js: ['$js/app_public'],
        css: ['$css/app_public']
      },

      private:{
        js:['$js/app_private'],
        css: ['$css/app_private']
      }
    });

    bundle({name:'app_premium', extend:'app'},{
      public:{
        js:['$js/premium_public', '$js/premium_public2'],
        css: ['$css/premium_private']
      },
      private:{
        js:['$js/premium_private']
      }
    });

    t.deepEqual(this.P.assets, {
      js: {
        app: [ '$js/app_public', '$js/app_private' ],
        app_premium: [ '$js/app_public','$js/premium_public','$js/premium_public2','$js/premium_private' ] },

      css: {
        app: [ '$css/app_public', '$css/app_private' ],
        app_premium: [ '$css/app_public', '$css/premium_private' ]
      }
    });

    t.done();
  },

  varExtractorBugFix: function(t){
    this.P.resolve.js  = function(filename){return'/assets/js/'+filename+'.js';};

    var bundleUp = {
      addJs:function(file){
        t.equal(file, '/assets/js/SlickGrid/lib/jquery.event.drag-2.0.min.js');
        t.done();
      }
    };

    this.P._addResource(bundleUp, 'js', '', '$js/SlickGrid/lib/jquery.event.drag-2.0.min');
  }
};
