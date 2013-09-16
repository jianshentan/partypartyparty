var mongoose        = require('mongoose');
var async           = require('async');
var util            = require('../models/util');
var db              = require('../db');
var User            = mongoose.model('User');
var Upvote          = mongoose.model('Upvote');
var FriendRequest   = mongoose.model('FriendRequest');

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

/*
 * TODO: test!
 */
exports.getFriend = function(req, res) {
    var ret = {};
    async.parallel([
        function(callback) {
            Upvote.find({"owner": req.query.friendId}, function(err, upvotes) {
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
