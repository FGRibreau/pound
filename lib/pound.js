var BundleUp = require('bundle-up')
path         = require('path')
,   _        = require('lodash');

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

Pound.toBundleUpMethod = function(bundleUp, type){
  return bundleUp['add'+type[0].toUpperCase()+type.slice(1)].bind(bundleUp);
};

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
Pound.prototype.precompile = function(){
  var app            = new (require('events').EventEmitter)();

  app.dynamicHelpers = function noop(){};
  app.use            = function noop(){};

  this.configure(app);
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

Pound.prototype.varExtractor = /\$(.*)\//gi;

Pound.prototype._addResource = function(bundleUp, type, assetGroup, resource){
  if(_.isObject(resource)){ // object
    console.error('bundle-up doesn\'t support objet', resource);
    // return this.client[type].addOb(resource);
    return;
  }

  if(resource.substring(0,2) === '//'){ // url
    console.error('bundle-up doesn\'t support url', resource);
    // return this.client[type].addUrl(assetGroup, resource.substr(1)+'.'+type);
    return;
  }

  if(resource[0] === '$'){ // static/${name}.type
    this.varExtractor.lastIndex = 0;
    var fileType = this.varExtractor.exec(resource)[1]
    ,   filename = resource.replace(this.varExtractor, '');

    // Template type
    if(this.userDefinedTypes[type]){
      console.error('bundle-up userDefinedTypes are not implemented', type);
      return;
      // var specialType = this.userDefinedTypes[type];
      // return specialType.handler(bundleUp[specialType.addMethod].bind(bundleUp), assetGroup, resource, this.resolve[fileType] ? this.resolve[fileType].bind(this, filename) : function(){throw new Error('Undefined resolve() for "'+ fileType + '"');});
    }

    if(this.resolve[fileType]){
      return Pound.toBundleUpMethod(bundleUp, type)(this.resolve[fileType].call(this, filename), assetGroup);
    }

    // Fallback
    return Pound.toBundleUpMethod(bundleUp, type)(this.publicDir + '/'+fileType+'/'+filename+'.'+type, assetGroup);
  }
};


/**
 * Bind piler middleware to express
 * @param  {Express/Connect} app Express/Connect instance
 */
Pound.prototype.configure = function(app){

  BundleUp(app, this._addAssets.bind(this), {
    staticRoot: this.publicDir + '/',
    staticUrlRoot: this.staticUrlRoot,
    bundle:this.isProduction,
    minifyCss: this.isProduction,
    minifyJs: this.isProduction
  });

};


module.exports = Pound;

function subattr_exist(obj, subattr_name){
  return function(attr){
    return obj[attr] && obj[attr][subattr_name] !== undefined;
  };
}
