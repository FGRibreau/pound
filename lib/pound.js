var piler = require('piler')
,   _     = require('lodash');

function Pound(){
  _.bindAll(this);

  /**
   * Default public directory
   * @type {String}
   */
  this.publicDir = __dirname + '/public';

  /**
   * Piler clients
   * @type {Hash}
   */
  this.client = {
      js:piler.createJSManager()
    , css:piler.createCSSManager()
  };

  /**
   * Asset list
   * @type {Hash}
   */
  this.assets = {};

  /**
   * User defined types
   * @type {Hash}
   */
  this.userDefinedTypes = {};

  /**
   * Default resolve path functions
   */
  this.resolve = {
    css:function(filename){return this.publicDir + '/css/'+filename+'.css';}
  , js:function(filename){return this.publicDir + '/js/'+filename+'.js';}
  };
}

/**
 * Create a new instance
 * @return {Pound} A new pound instance
 */
Pound.prototype.create = function() {
  return new Pound();
};


/**
 * Define an asset
 * @param  {Hash} options {name:'myGroupOfAsset', [extend:'group']}
 * @param  {Array} assets  Array of resources
 * @chainable
 */
Pound.prototype.defineAsset = function(options, assets){
  if(!options){options = {};}

  if(!options.name){
    throw new Error("Pound.defineAsset option `name` should be defined");
  }

  function subattr_exist(obj, subattr_name){
    return function(attr){
      return obj[attr] && obj[attr][subattr_name] !== undefined;
    }
  }

  // Extend
  if(options.extend){
    Object.keys(this.assets)
    .filter(subattr_exist(this.assets, options.extend))
    .forEach(function(ressourceType){
      this.assets[ressourceType][options.name] = this.assets[ressourceType][options.extend];
    }.bind(this));
  }

  Object.keys(assets).forEach(function(ressourceType){
    if(!this.assets[ressourceType]){
      this.assets[ressourceType] = {};
    }

    this.assets[ressourceType][options.name] = _.union(this.assets[ressourceType][options.name] || [], _.compact(assets[ressourceType] || []));
  }.bind(this));

  return this;
};

Pound.prototype.defineType = function(options){
  if(!options){options = {};}

  if(!options.name){
    throw new Error("Pound.defineType option `name` should be defined");
  }

  if(!options.handler){
    throw new Error("Pound.defineType option `handler` should be defined");
  }

  if(!options.pilerClient){
    options.pilerClient = 'js';
  }

  this.userDefinedTypes[options.name] = options;

  return this;
};

/**
 * Precompile the assets
 */
Pound.prototype.precompile = function(){
  var app = new (require('events').EventEmitter)();

  app.dynamicHelpers = function noop(){};
  app.use = function noop(){};

  // Set both clients in production mode
  _.forEach(this.client.js.piles, function(v){v.production = true;});
  _.forEach(this.client.css.piles, function(v){v.production = true;});

  this.client.js.production = true;
  this.client.css.production = true;

  this.configure(app);

  // Simulate a server starts
  app.emit('listening');
};


Pound.prototype._addAssets = function(){
  // Loop over all type of assets
  Object.keys(this.assets).forEach(this._addAssetType.bind(this));
};

Pound.prototype._addAssetType = function(type){
  var assetType = this.assets[type];

  // Loop over all group of asset
  Object.keys(assetType).forEach(this._addAssetGroup.bind(this, assetType, type));
};

Pound.prototype._addAssetGroup = function(assetType, type, assetGroup){
  // Loop over all resources of the assetGroup
  assetType[assetGroup].forEach(this._addResource.bind(this, type, assetGroup));
};

Pound.prototype.varExtractor = /\$(.*)\//gi;

Pound.prototype._addResource = function(type, assetGroup, resource){
  if(typeof resource === 'object'){ // object
    return this.client[type].addOb(resource);
  }

  if(resource.substring(0,2) === '//'){ // url
    return this.client[type].addUrl(assetGroup, resource.substr(1)+'.'+type);
  }

  if(resource[0] === '$'){ // static/${name}.type
    this.varExtractor.lastIndex = 0;
    var fileType = this.varExtractor.exec(resource)[1]
    ,   filename = resource.replace(this.varExtractor, '');

    // Template type
    if(this.userDefinedTypes[type]){
      var specialType = this.userDefinedTypes[type];
      return specialType.handler(this.client[specialType.pilerClient], assetGroup, resource, this.resolve[fileType] ? this.resolve[fileType].bind(this, filename) : function(){throw new Error('Undefined resolve() for "'+ fileType + '"');});
    }

    if(this.resolve[fileType]){
      return this.client[type].addFile(assetGroup, this.resolve[fileType].call(this, filename));
    }

    // Fallback
    return this.client[type].addFile(assetGroup, this.publicDir + '/'+fileType+'/'+filename+'.'+type);
  }
};

/**
 * Bind piler middleware to express
 * @param  {Express/Connect} app Express/Connect instance
 */
Pound.prototype.configure = function(app){

  // Bind Piler js & css clients to the application
  this.client.js.bind(app);
  this.client.css.bind(app);

  // Add assets to clients
  this._addAssets();

  this._setDynamicHelpers(app);
};

Pound.prototype._setDynamicHelpers =function(app){
  var self = this;

  // http://bit.ly/NZ4wu0 my reaction: http://bit.ly/NZ4u5D

  var renderScriptTags = function(req, res){
    var inline = "";

    if(res._responseObs){
      for(ob in res._responseObs){
        inline += self.client.js.toGlobals(ob)
      }
    }

    if(res._responseFns){
      for(fn in res._responseFns){
        inline += self.client.js.executableFrom(fn)
      }
    }

    return function(){
      return self.client.js.renderTags.apply(self.client.js, arguments)
        + (inline ? '<script type="text/javascript">{'+inline+'}</script>' :'');
    };
  };

  var renderStyleTags = function(){
    return function(){
      return self.client.css.renderTags.apply(self.client.css, arguments);
    };
  };

  if('function' === typeof app.dynamicHelpers) {
    // Support for Express 2
    app.dynamicHelpers({
        renderStyleTags: renderStyleTags,
        renderScriptTags: renderScriptTags
    });

  } else if('function' === typeof app.locals.use) {
    // Support for Express 3
    app.locals.use(function(req, res) {
      res.locals.renderScriptTags = renderScriptTags(req, res);
      res.locals.renderStyleTags = renderStyleTags(req, res);
    });

  }
};

module.exports = new Pound();
