var mongoose        = require('mongoose');
var async           = require('async');
var util            = require('../models/util');
var db              = require('../db');
var Party           = mongoose.model('Party');
var User            = mongoose.model('User');
var Upvote          = mongoose.model('Upvote');
var FriendRequest   = mongoose.model('FriendRequest');

exports.index = function(req, res) {
    res.render('index', { title: 'Party time!' });
};

exports.start = function(req, res) {
    res.render('index', { title: 'Sign Up time!' });
};

exports.auth = function(req, res, next) {
    if (req.session && req.session.userId) {
        User.find({"_id":req.session.userId}, function(err, user) {
            if (err) { return util.handleError("could not retreive user", err); }
            if (user) {
                next();
            } else {
                res.redirect('/start');
            }
        });
    } else {
        res.redirect('/start');
    }
};

exports.login = function(req, res) {
    User.findOne({"email": req.body.email}, function(err, user) {
        if (err) { return util.handleError("could not find user by email", err); }
        if (!user) {
            res.send("Email address does not exist.");
            return;
        } else {
            if (user.authenticate(req.body.password)) {
                req.session.userId = user.id;
                res.send("Logged in.");
            } else {
                res.send("Incorrect password.");
            }
        }
    });
};

exports.logout = function(req, res) {
    delete req.session.userId; 
    res.send("Logged out.");
};

exports.signup = function(req, res) {
    async.series([
        function(callback) {
            User.findOne({ $or: [{username: req.body.username},
                                 {email: req.body.email}] },
                function(err, user) {
                if (err) { return util.handleError("could not query user", err); }
                if (user) { res.send("username/email already exists!"); }
                else
                    callback();
            });
        },
        function(callback) {
            new User({
                username : req.body.username
              , password : req.body.password
              , name : {
                           first : req.body.firstname
                         , last : req.body.lastname
                       }
              , email : req.body.email
              , friends : []
            }).save(function(err, user) {
                if (err) { return util.handleError("could not sign up new user", err); }
                req.session.userId = user.id;
                res.send("New user is saved!");
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not register", err); }
    });
};

exports.postParty = function(req, res) {
    /* TODO: check for duplicates */

    /* hack : leave address field empty to activate hack*/
    if (req.body.address == null) {
        address = {
            street: "cit"
          , city: "providence"
          , state: "RI"
          , country: "America"
          , zip: "02991"
        }
    }

    var date = util.parseDate(req.body.time);
    if (date == null) { return util.handleError("parseDate did not work on", req.body.time); }
    
    new Party({
        name        : req.body.name
      , description : req.body.description
      , owner       : req.session.userId
      , time        : date
      , address     : req.body.address
      , rating      : 0 // all parties start at rating 0
    }).save(function(err, data) {
        if (err) { return util.handleError("could not save the posted party", err); }
        res.redirect('/');
    });
};

/*
 * TODO: Test
 */
exports.postUpvote = function(req, res) {
    new Upvote({
        owner       : req.session.userId
      , description : req.body.description
      , party       : req.body.partyId
    }).save(function(err, data) {
        if (err) { return util.handlerError("could not save posted upvote", err); }
        res.redirection('/');
    });
};

exports.getParty = function(req, res) {
    var partyId = req.query.partyId;
    var ret = {};
    async.parallel([
        function(callback) {
            Party.find({"_id":partyId}, function(err, party) {
                if (err) { return util.handleError("could not get party data", err); }
                ret.party = party;
                callback();
            });
        },
        function(callback) {
            Upvote.find({ "party": partyId }, function(err, upvotes) {
                if (err) { return util.handleError("could not get related upvotes", err); }
                ret.upvotes = upvotes;
                callback();
            });
        }
    ], function(err, results) {
        if (err) { return util.handleError("could not get upvotes of the party", err); }
        res.send(ret);
    });
};

exports.getParties = function(req, res) {
    var userId = req.session.userId;

    var friends = [];
    var parties = [];
    var partyIds = [];

    async.series([
        function(callback) {
            User.findOne({ "_id": userId }, function(err, user) {
                if (err) { return util.handleError("could not get user data", err); }
                friends = user.friends;
                callback();
            });
        },
        function(callback) {
            Upvote.find({ "owner": { $in : friends } }, function(err, upvoteList) {
                if (err) { return util.handleError("could not find party ids", err); }
                for (var u in upvoteList) {
                    var flag = true;
                    for (var k in partyIds) {
                        if (partyIds[k].equals(upvoteList[u].party)) {
                            flag = false;
                            break;
                        }
                    }
                    if (flag)
                        partyIds.push(upvoteList[u].party);
                }
                callback();
            });
        },
        function(callback) {
            Party.find({ $or: [ { "owner": { $in : friends } }, 
                                { "_id": { $in : partyIds } } ] }, 
                       function(err, partyList) {
                if (err) { return util.handleError("could not find parties", err); }
                for (var p in partyList) {
                    parties.push(partyList[p]);
                }
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not find parties from user", err); }
        res.send(parties);
    });
};

exports.getFriends = function(req, res) {
    var friendIds = [];
    var friends = [];
    async.series([
        function(callback) {
            User.findOne({"_id" : req.session.userId}, function(err, user) {
                if (err) { return util.handleError("could not find user", err); }
                if (user) {
                    friendIds = user.friends;
                    callback();
                } else 
                    return util.handleError("no users found", ""); 
            });
        },
        function(callback) {
            User.find({"_id": { $in : friendIds }}, function(err, friendList) {
                if (err) { return util.handleError("could not find friends :(", err); }
                friends = friendList;
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not find friends :(", err); }
        res.send(friends);
    });
};

exports.getFriend = function(req, res) {
    var ret = {};
    async.parallel([
        function(callback) {
            Upvotes.find({"owner": req.query.friendId}, function(err, upvotes) {
                if (err) { return util.handleError("could not get upvotes", err); }
                ret.upvotes = upvotes;
                callback();
            });
        },
        function(callback) {
            User.findOne({"_id": req.query.friendId}, function(err, friend) {
                if (err) { return util.handleError("could not get friend", err); }
                ret.friend = friend;
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not find friends & upvotes", err); }
        res.send(ret);
    });
};

exports.findUser = function(req, res) {
    var ret = [];
    var users;
    async.series([
        function(callback) {
            User.find( { $or : [{"username": req.query.input}, 
                                {"email": req.query.input},
                                {"name.first": req.query.input},
                                {"name.last": req.query.input}] }, 
                       function(err, userList) {
                if (err) { return util.handleError("could not find user w/ search query", err); }
                users = userList;
                //res.send(users);
                callback();
            });
        },
        function(callback) {
            FriendRequest.find( { $or: [{"from": req.session.userId, "to": { $in: users} },
                                        {"to": req.session.userId, "from": { $in: users} }] },
                function(err, requestList) {
                if (err) { return util.handleError("could not find requests", err); }
                for (var u in users) {
                    var flag = true;
                    for (var r in requestList) {
                        if (users[u]._id.equals(requestList[r].to) ||
                            users[u]._id.equals(requestList[r].from)) {
                            ret.push({"user": users[u], "requestState": requestList[r]});
                            flag = false;
                        }
                    }
                    if (flag)
                        ret.push({"user": users[u], "requestState": null});
                }
                callback();
            }); 
        }
    ], function(err) {
        if (err) { return util.handleError("could not find user", err); }
        res.send(ret);
    });
};

exports.sendFriendRequest = function(req, res) {
    // TODO: check that it does not already exist
    async.series([
        function(callback) {
            FriendRequest.findOne({"from": req.session.userId, "to": req.query.friend},
                function(err, request) {
                if (err) { return util.handleErro("could not get friend request", err); }
                if (request) {
                    res.send("this friend request already exists!");
                    return;
                } else
                    callback();
            });
        },
        function(callback) {
            console.log("SESSION: " + req.session.userId);
            new FriendRequest({
                from : req.session.userId
              , to : req.query.friend
              , state : db.friendRequestStatus.PENDING
            }).save(function(err, data) {
                if (err) { return util.handleError("could not send friend request", err); }
                res.send('friend request sent');
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not process sending friend requeset", ""); }
    });
};

exports.getFriendRequests = function(req, res) {
    var friendRequests = [];
    var ret;
    async.series([
        function(callback) {
            FriendRequest.find({to: req.session.userId, state: db.friendRequestStatus.PENDING}, 
                function(err, friendRequestList) {
                if (err) { return util.handleError("could not find friends", err); }
                for (var f in friendRequestList) 
                    friendRequests.push(friendRequestList[f].from);
                callback();
            });
        },
        function(callback) {
            User.find({ "_id": { $in: friendRequests} }, function(err, users) {
                if (err) { return util.handleError("could not get friends from requests", err); }
                ret = users;
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not get friend requests", err); }
        res.send(ret);
    });
};

exports.getPendingRequests = function(req, res) {
    var pendingRequests = [];
    var ret;
    async.series([
        function(callback) {
            FriendRequest.find({from: req.session.userId, state: db.friendRequestStatus.PENDING},
                function(err, pendingRequestList) {
                if (err) { return util.handleError("could not find friends", err); }
                for (var p in pendingRequestList) 
                    pendingRequests.push(pendingRequestList[p].to);
                callback();
            });
        },
        function(callback) {
            User.find({"_id": { $in: pendingRequests} }, function(err, users) {
                if (err) { return util.handleError("could not get pending friends", err); }
                ret = users;
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not get pending friends", err); }
        res.send(ret);
    });
};

exports.acceptFriendRequest = function(req, res) {
    var friendId;
    async.series([
        function(callback) {
            FriendRequest.findOne({to: req.session.userId, 
                                   from: req.query.friend,
                                   state: db.friendRequestStatus.PENDING}, 
                function(err, request) {
                if (err) { return util.handleError("could not get requst data", err); }
                if (request) {
                    request.state = db.friendRequestStatus.ACCEPT;
                    friendId = request.from;
                    request.save(function(err) {
                        if (err) { 
                            return util.handleError("could not save state of request", err); 
                        }
                    }); 
                    callback();
                } else {
                    return util.handleError("no friend request found", "");
                }
            });
        },
        function(callback) {
            User.findOne({"_id": req.session.userId}, function(err, user) {
                if (err) { return util.handleError("could not add friend to curr user", err); }
                user.friends.push(req.query.friend);
                user.save(function(err) {
                    if (err) { 
                        return util.handleError("current user could not save new friend", err); 
                    }
                });
                callback();
            });
        },
        function(callback) {
            User.findOne({"_id": friendId}, function(err, user) {
                if (err) { return util.handleError("could not add curr user to friend", err); }
                user.friends.push(req.session.userId);
                user.save(function(err) {
                    if (err) { 
                        return util.handleError("requsting user could not save new friend", err);
                    }
                });
                callback();
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not process accept-friend request", err); }
        res.send("Accepted friend request");
    });    
};

exports.declineFriendRequest = function(req, res) {
    FriendRequest.findOne({to: req.session.userId, 
                           from: req.query.friend,
                           state: db.friendRequestStatus.PENDING}, 
        function(err, request) {
        if (err) { return util.handleError("could not get requst data", err); }
        if (request) {
            request.state = db.friendRequestStatus.REJECTED;
            request.save(function(err) {
                if (err) { 
                    return util.handleError("could not save state of request", err); 
                }
            }); 
            res.send("declined friend request");
        } else {
            return util.handleError("no friend request found", "");
        }
    });
};
