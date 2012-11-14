var BundleUp = require('bundle-up2'),
path         = require('path'),
_            = require('lodash');

function iffb(b, r){return typeof(b) === "boolean" ? l : r;}

function Pound(options){
  _.bindAll(this);

  options = options || {};

  /**
   * Default public directory
   * @type {String}
   */
  if(!options.publicDir){
    throw new Error("Pound.create({publicDir: \"/public\"}) is undefined");
  }
  this.publicDir = options.publicDir;

  if(!options.staticUrlRoot){
    throw new Error("Pound.create({staticUrlRoot: \"/\"}) is undefined");
  }
  this.staticUrlRoot = options.staticUrlRoot;

  if(_.isUndefined(options.isProduction)){
    options.isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  }

  this.isProduction = options.isProduction;


  this.minifyCss    = iffb(options.minifyCss, this.isProduction);
  this.minifyJs     = iffb(options.minifyJs, this.isProduction);

  /**
   * Asset list
   * @type {Hash}
   */
  this.assets = {};

  /**
   * Public namespace for inheritance
   * @type {String}
   */
  this._publicNS = "__public__";

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
Pound.create = function(options) {
  var p = _.bindAll(new Pound(options));
  p.create = Pound.create;
  return p;
};

/**
 * Define an asset
 * @param  {Hash} options {name:'myGroupOfAsset', [extend:'group']}
 * @param  {Array} assets  Array of resources
 * @chainable
 */
Pound.prototype.defineAsset = function(options, assets){
  if(!options){options = {};}

  if(_.isString(options)){
    options = {name:options};
  }

  if(!options.name){
    throw new Error("Pound.defineAsset option `name` should be defined");
  }

  // Extend
  if(options.extend){
    Object.keys(this.assets)
      .filter(subattr_exist(this.assets, options.extend+this._publicNS))
      .forEach(function(ressourceType){

        var superNs = options.extend+this._publicNS;
        var ns      = options.name+this._publicNS;

        // Specify the ressourceType.ns__ assets that get its first values from the super bundle
        this.assets[ressourceType][options.name] = this.assets[ressourceType][superNs];

        // Specify the ressourceType.ns__public__ assets for further extends
        this.assets[ressourceType][ns] = this.assets[ressourceType][superNs];
      }.bind(this));
  }

  // Flatten private & public declaration
  if(assets.public || assets.private){
    this._addType(assets.public || {}, options.name, true);
    this._addType(assets.private || {}, options.name, false);
  } else {
    this._addType(assets, options.name, true);
  }

  return this;
};


/**
 * Add a type of asset for a specified namespace
 * @param {Object} assets    Asset to insert
 * @param {String} namespace namespace
 * @param {Boolean} [_isPublic]
 */
Pound.prototype._addType = function(assets, namespace, _isPublic){

  Object.keys(assets).forEach(function(ressourceType){
    if(!this.assets[ressourceType]){this.assets[ressourceType] = {};}
    this.assets[ressourceType][namespace] = _.union(this.assets[ressourceType][namespace] || [], _.compact(assets[ressourceType] || []));

    if(_isPublic){
      var ns = namespace+this._publicNS;
      this.assets[ressourceType][ns] = _.union(this.assets[ressourceType][ns] || [], _.compact(assets[ressourceType] || []));
    }

  }.bind(this));

};

Pound._toBundleUpMethod = function(fnMethod){
  return function(bundleUp, type){
    return bundleUp[fnMethod(bundleUp, type)].bind(bundleUp);
  };
};

Pound.bundleUpAddFile = Pound._toBundleUpMethod(function(_, type){
  return 'add'+type[0].toUpperCase()+type.slice(1);
});

Pound.bundleUpAddUrl = Pound._toBundleUpMethod(function(_, type){
  return 'add'+type[0].toUpperCase()+type.slice(1)+'Url';
});

Pound.bundleUpAddObject = Pound._toBundleUpMethod(function(_, type){
  if(type === 'css'){
    throw new Error("Bundle-up doesn't support addCssObject");
  }

  return 'addJsObject';
});


Pound.prototype.defineType = function(options){
  if(!options){options = {};}

  if(!options.name){
    throw new Error("Pound.defineType option `name` should be defined");
  }

  if(!options.handler){
    throw new Error("Pound.defineType option `handler` should be defined");
  }

  options.addMethod = options.addMethod ? 'add' + options.addMethod : 'addJs';

  this.userDefinedTypes[options.name] = options;

  return this;
};

/**
 * Precompile the assets
 */
Pound.prototype.precompile = function(cb){
  var app            = new (require('events').EventEmitter)();

  app.dynamicHelpers = function noop(){};
  app.use            = function noop(){};

  this.configure(app, cb);
};


Pound.prototype._addAssets = function(bundleUp){
  // Loop over all type of assets
  Object.keys(this.assets).forEach(this._addAssetType.bind(this, bundleUp));
};

Pound.prototype._addAssetType = function(bundleUp, type){
  var assetType = this.assets[type];

  // Loop over all group of asset
  Object.keys(assetType).forEach(this._addAssetGroup.bind(this, bundleUp, assetType, type));
};

Pound.prototype._addAssetGroup = function(bundleUp, assetType, type, assetGroup){
  // Loop over all resources of the assetGroup
  assetType[assetGroup].forEach(this._addResource.bind(this, bundleUp, type, assetGroup));
};

Pound.prototype.varExtractor = /\$([^\/]*)\//gi;

Pound.prototype._addResource = function(bundleUp, type, assetGroup, resource){
  if(_.isObject(resource)){ // object
    //console.log(assetGroup, 'addObject', resource);
    return Pound.bundleUpAddObject(bundleUp, type)(resource, assetGroup);
  }

  if(resource.substring(0,2) === '//'){ // url
    //console.log(assetGroup, 'addUrl', resource);
    return Pound.bundleUpAddUrl(bundleUp, type)(resource.substr(1)+'.'+type, assetGroup);
  }

  if(resource.substring(0, 7) === 'http://'){ // url v2
    //console.log(assetGroup, 'addUrl', resource);
    return Pound.bundleUpAddUrl(bundleUp, type)(resource+'.'+type, assetGroup);
  }

  if(resource[0] === '$'){ // static/${name}.type
    this.varExtractor.lastIndex = 0;
    var fileType = this.varExtractor.exec(resource)[1]
    ,   filename = resource.replace(this.varExtractor, '');


    // Template type
    if(this.userDefinedTypes[type]){
      var specialType = this.userDefinedTypes[type];
      //console.log(assetGroup, 'addObject', this.resolve[fileType].bind(this, filename)());
      return specialType.handler(bundleUp, assetGroup, resource, this.resolve[fileType] ? this.resolve[fileType].bind(this, filename) : function(){throw new Error('Undefined resolve() for "'+ fileType + '"');});
    }

    if(this.resolve[fileType]){
      //console.log(assetGroup, 'addFile', this.resolve[fileType].bind(this, filename)());
      return Pound.bundleUpAddFile(bundleUp, type)(this.resolve[fileType].call(this, filename), assetGroup);
    } else {
      throw new Error("Resolve function not defined for "+fileType+" type");
    }
  }
};


/**
 * Bind piler middleware to express
 * @param  {Express/Connect} app Express/Connect instance
 */
Pound.prototype.configure = function(app, cb){

  BundleUp(app, this._addAssets.bind(this), {
    staticRoot: this.publicDir + '/',
    staticUrlRoot: this.staticUrlRoot,
    bundle:this.isProduction,
    minifyCss: this.minifyCss,
    minifyJs: this.minifyJs,
    complete: cb || function(){}
  });

};


module.exports = Pound;

function subattr_exist(obj, subattr_name){
  return function(attr){
    return obj[attr] && obj[attr][subattr_name] !== undefined;
  };
}
