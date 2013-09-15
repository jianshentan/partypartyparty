
/**
 * Module dependencies.
 */

  //, user = require('./routes/user')
var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

// mongoose setup
require('./db');

// connect to router
var routes = require('./routes')

var MemoryStore = express.session.MemoryStore();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('keyboard cat')); // session
app.use(express.session()); // session
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Pages
app.get('/', routes.auth, routes.index);
app.get('/start', routes.start);

app.post('/postParty', routes.postParty);
app.get('/postUpvote', routes.postUpvote);

app.get('/getParty', routes.getParty);
app.get('/getParties', routes.getParties);

app.post('/start/login', routes.login);
app.post('/start/logout', routes.logout);
app.post('/start/signup', routes.signup);

app.get('/getFriends', routes.getFriends);
/*
app.post('/addFriend', routes.addFriend);
app.get('/getFriend', routes.getFriend);
*/

app.get('/findUser', routes.findUser);
app.get('/sendFriendRequest', routes.sendFriendRequest);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
