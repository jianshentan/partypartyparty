
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
  , auth = require('./routes/auth')
  , party = require('./routes/party')
  , friend = require('./routes/friend');

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

// Index 
app.get('/', auth.auth, routes.index);
app.get('/start', routes.start);

// Auth
app.get('/getSelf', auth.getSelf);
app.post('/start/login', auth.login); 
app.post('/start/logout', auth.logout);
app.post('/start/signup', auth.signup);

// Party
app.post('/postParty', auth.auth, party.postParty); 
app.post('/postUpvote', auth.auth, party.postUpvote);
app.get('/getParty', auth.auth, party.getParty); 
app.get('/getParties', auth.auth, party.getParties);

// Friend
app.get('/getFriends', auth.auth, friend.getFriends);
app.get('/getFriend', auth.auth, friend.getFriend);
app.get('/findUser', auth.auth, friend.findUser);
app.get('/sendFriendRequest', auth.auth, friend.sendFriendRequest);
app.get('/getFriendRequests', auth.auth, friend.getFriendRequests);
app.get('/getPendingRequests', auth.auth, friend.getPendingRequests);
app.get('/acceptFriendRequest', auth.auth, friend.acceptFriendRequest);
app.get('/declineFriendRequest', auth.auth, friend.declineFriendRequest);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
