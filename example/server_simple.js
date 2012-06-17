var express     = require('express')
,   pound       = require('../')
,   defineAsset = pound.defineAsset;

// Define where is the public directory
pound.publicDir = __dirname + '/assets';

defineAsset({name:'home'}, {
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

defineAsset({name:'app', extend:'home'}, {
  js:[
      {'MyApp.env':{}} // object
    , '$js/bootbox.2.3.1'
    , '//sio/socket.io.js' // url
  ],

  css:[
      '$css/bootstrap-responsive.0.2.4'
    , '$css/bootstrap.0.2.4'
    , '$css/font-awesome.2.0'
    , '$css/global'
  ]
});

var app =  express.createServer();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // Assets configuration
    pound.configure(app);

    app.use(express.static(__dirname + '/public'));
});

function render(view) {return function(req, res) {res.render(view);};}

app.get('/', render('home'));
app.get('/', render('app'));

app.listen(8080, function(){console.log('Express listening on', app.address().port);});
