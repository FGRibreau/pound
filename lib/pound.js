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

  Object.keys(assets).forEach(function(ressourceType){
    if(!this.assets[ressourceType]){
      this.assets[ressourceType] = {};
    }


    this.assets[ressourceType][options.name] = _.union(
          options.extend && this.assets[ressourceType][options.extend] ? this.assets[ressourceType][options.extend] : []
        , _.compact(assets[ressourceType] || []));
  }.bind(this));

  return this;
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
};

module.exports = new Pound();
