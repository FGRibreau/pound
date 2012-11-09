Pound [![Build Status](https://secure.travis-ci.org/FGRibreau/pound.png)](http://travis-ci.org/FGRibreau/pound)
==========

Pound 2.0 - High-level asset management for NodeJS/Express like it should be.

Pound allows you to think of **assets in terms of packages/bundles**.

Pound supports **Express 2 and 3** and use [Bundle-Up](https://github.com/FGRibreau/bundle-up) as the underlying asset manager.

Npm
----
    npm install pound

Basic usage
------------

**example/server_simple.js**
```javascript
var express = require('express')
,   Pound   = require('pound')
,   bundle  = pound.defineAsset; // alias

// Define where is the public directory
var pound = Pound.create({
  publicDir: __dirname+'/public',
  staticUrlRoot: '/'
});

// By default all bundle's assets are public (if another inherit from it, it'll get all of those assets)
bundle('home', {
  // Css assets
  css:[
    '$css/bootstrap-responsive.0.2.4'  // will resolve $js with the pound.resolve.css function
  , '$css/bootstrap.0.2.4'
  , '$css/font-awesome.2.0'
  , '$css/global'
  ],

  // JS assets
  js:[
    '$js/jquery.1.7.2'  // will resolve $js with the pound.resolve.js function
  , '$js/bootstrap.0.2.4'
  ]
});

bundle({name:'app', extend:'home'}, {

  css:[
      'http://twitter.github.com/bootstrap/assets/css/bootstrap' // global url are supported
      '$css/bootstrap-responsive.0.2.4'
    , '$css/bootstrap.0.2.4'
    , '$css/font-awesome.2.0'
    , '$css/global'
  ],

  js:[
      {'MyApp.env':{}} // object
    , '$js/bootbox.2.3.1'
    , '//sio/socket.io.js' // relative url are supported as well
  ]
});

var app =  express.createServer();

app.configure(function(){
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // Assets configuration
    pound.configure(app);

    // pound.configure(app, [callback on complete])
    // the callback will be called Pound is ready.

    app.use(express.static(__dirname + '/public'));
});

function render(view) {return function(req, res) {res.render(view);};}

app.get('/', render('home'));
app.get('/', render('app'));

app.listen(8080, function(){console.log('Express listening on', app.address().port);});
```

**example/view/home.jade**
```jade
!!! 5
html
  head
    title Pound rocks !
    !{renderStyle("home")}
  body
    p Look at the source code and then try to start the server with
      <pre>NODE_ENV=production node server.js</pre>
    a(href="/app") Go the app page (with app assets)

    !{renderScript("home")}
```

**example/view/app.jade**
```jade
!!! 5
html
  head
    title Pound rocks !
    !{renderStyle("app")}
  body
    p Look at the source code and then try to start the server with
      <pre>NODE_ENV=production node server.js</pre>
    a(href="/") Go the homepage (with the home assets)

    !{renderScript("app")}
```


Recommended usage
-----------------

**example/server.js**
```javascript
var express = require('express'),
assets      = require('./assets'),
app         = express.createServer();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  // Assets automatic configuration thanks to Pound
  assets.configure(app);

  // We still need express.static for serving images and fonts
  app.use(express.static(__dirname + '/public'));
});

function render(view) {return function(req, res) {res.render(view);};}

app.get('/',    render('home'));
app.get('/app', render('app'));

app.listen(8080, function(){console.log('Express listening on', app.address().port);});
```

**example/assets.js**
```javascript
/**
* Specify the assets
*/

var pound              = require('pound')
,   bundle             = pound.defineAsset;

// Default parameters are:
// pound.public        = __dirname + '/public';
// pound.resolve.css   = function(filename){return this.publicDir + '/css/'+filename+'.css';};
// pound.resolve.js    = function(filename){return this.publicDir + '/js/'+filename+'.js';};

// Override default resolve function for `$js` and `$css`
pound.resolve.js       = function(filename){return __dirname + '/assets/js/'+filename+'.js';};
pound.resolve.css      = function(filename){return __dirname + '/assets/css/'+filename+'.css';};

// Add new resolve function for `$myCssDir` and `$appjs`
// The resolve function's result will replace `$resolveFunctionName` for each resources
pound.resolve.myCssDir = function(filename){return __dirname + '/assets/css/'+filename+'.css';};
pound.resolve.appjs    = function(filename){return __dirname + '/app/'+filename+'.js';};

bundle('home', {
  // Css assets
  css:[
    '$myCssDir/bootstrap-responsive.0.2.4'  // will resolve $js with the pound.resolve.myCssDir function
  , '$myCssDir/bootstrap.0.2.4'
  , '$myCssDir/font-awesome.2.0'
  ],

  // JS assets
  js:[
    '$js/jquery.1.7.2'  // will resolve $js with the pound.resolve.js function
  , '$js/bootstrap.0.2.4'
  ]
});

bundle({name:'app', extend:'home'}, {
  css:[
    '$css/global'
  ],

  js:[
    {'MyApp.env':{}} // object
  , '$js/bootbox.2.3.1'
  , '//socket.io.js' // url
  , '$appjs/app' // Backbone.sync override
  ]
});

module.exports = pound;
```

`views/app.jade` and `view/home.jade` are the same as mentionned in the **simple usage**

Oh wait... and it supports OO-style inheritance
-----------------------------------------------

```javascript

bundle('app', {
  public:{
    // this will be available to `app` bundle and bundles that inherit from it.
    js:['$js/jquery', '$js/jqueryui', '$js/baseApp'],
    css:['$css/global']
  },

  private:{
    // the following assets will only be available from the home bundle
    js:['$js/upgrade']
  }
});

bundle({name:'apppremium', extend:'app'}, {
  public:{
    js:['$js/premiumextensions']
  }
});

```


License
-------
Copyright (c) 2012 Francois-Guillaume Ribreau (npm@fgribreau.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
