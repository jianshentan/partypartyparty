var mongoose    = require('mongoose');
var async       = require('async');
var Party       = mongoose.model('Party');
var User        = mongoose.model('User');
var Upvote      = mongoose.model('Upvote');

/* parse date 
 * expects: "yyyy-mm-dd hh:mm:ss";
 * returns: [yyyy, mm, dd, hh, mm, ss] *note that month is between 0-11
 */
function parseDate(d) {
    var ret = d.split(/[-: ]/);
    ret[1] = (parseInt(ret[1]) - 1).toString();
    if (ret.length != 6) { return null; }
    return ret;
}

// real routes
exports.index = function(req, res) {
    res.render('index', { title: 'Party time!' });
};

exports.start = function(req, res) {
    res.render('index', { title: 'Sign Up time!' });
};

// auth
exports.auth = function(req, res, next) {
    if (req.session && req.session.userId) {
        User.find({"_id":req.session.userId}, function(err, user) {
            if (err) {
                console.log("ERROR Could not retreive user: " + err);
                return;
            } else if (user) {
                next();
            } else {
                res.redirect('/start');
            }
        });
    } else {
        res.redirect('/start');
    }
};

/*
 * req.body: {
 *              email: string
 *            , password: string
 *           }
 */
exports.login = function(req, res) {
    User.findOne({"email": req.body.email}, function(err, user) {
        console.log('user: ' + user);
        if (err) {
            console.log("ERROR could not find user by email: " + err);
            return;
        } else if (!user) {
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

/*
 * req.body: {
 *              username: string
 *            , password: string
 *            , firstname: string
 *            , lastname: string
 *            , email: string
 *           }
 */
exports.signup = function(req, res) {
    // need to check that username and email are valid first
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
        if (err) {
            console.log("ERROR could not sign up new user: " + err);
            return;
        }
        res.send("New user is saved!");
    });
};

/*
 * TODO: implement
 */
exports.addFriend = function(req, res) {
    var friendId = req.body.friendId;
    User.find({"_id" : usersreq.session.userId}, function(err, user) {
        
    });
};


/*
 * req.body = {
 *                  name: string
 *                , description: string
 *                , time: "yyyy-mm-dd hh:mm:ss"
 *                , address: {
 *                              street: string
 *                            , city: string
 *                            , state: string
 *                            , country: string
 *                            , zip: string
 *                           }
 *            }
 */
exports.postParty = function(req, res) {
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

    var date = parseDate(req.body.time);
    if (date == null) {
        console.log("ERROR parseDate did not work");
        return;
    }
    
    new Party({
        name        : req.body.name
      , description : req.body.description
      , owner       : req.session.userId
      , time        : date
      , address     : req.body.address
      , rating      : 0 // all parties start at rating 0
    }).save(function(err, data) {
        if (err) { 
            console.log("ERROR Saving postParty: " + err);
            return null; 
        }
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
        if (err) {
            console.log("ERROR Saving postUpvote: " + err);
            return null;
        }
        res.redirection('/');
    });
};

/*
 * getParty returns:
 *   { 
 *       party : { <partySchema> }, 
 *       upvotes : [ { <upvoteSchema> } ]
 *   }
 */
exports.getParty = function(req, res) {
    var partyId = req.query.partyId;
    var ret = {};
    async.parallel([
        function(callback) {
            Party.find({"_id":partyId}, function(err, party) {
                if (err) {
                    console.log("ERROR Cannot get party data: " + err);
                    return;
                }
                ret.party = party;
                callback();
            });
        },
        function(callback) {
            Upvote.find({ "party": partyId }, function(err, upvotes) {
                if (err) {
                    console.log("ERROR Cannot get related upvotes: " + err);
                    return;
                }
                ret.upvotes = upvotes;
                callback();
            });
        }
    ], function(err, results) {
        if (err) { 
            console.log("ERROR Cannot get related upvotes/ upvotes connected to the party");
            return;
        }
        res.send(ret);
    });
};

/*
 * getParties return: [<partySchema>]
 */
exports.getParties = function(req, res) {
    // for each friend of <user>
    //      get party of upvotes where owner is friend
    //      get party where owner is friend
    var userId = req.session.userId;
    var friends = [];
    var parties = [];
    var partyIds = [];
    async.series([
        function(callback) {
            User.findOne({ "_id": userId }, function(err, user) {
                if (err) {
                    console.log("ERROR Could not get user data: " + err);
                    return;
                }
                friends = user.friends;
                callback();
            });
        },
        function(callback) {
            Upvote.find({ "owner": { $in : friends } }, function(err, upvoteList) {
                if (err) {
                    console.log("ERROR Could not find party ids: " + err);
                    return;
                } 
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
                if (err) {
                    console.log("ERROR Could not find parties: " + err);
                    return;
                }
                for (var p in partyList) {
                    parties.push(partyList[p]);
                }
                callback();
            });
        }
    ], function(err) {
        if (err) {
            console.log("ERROR Could not find parties from UserId: " + err);
            return;
        }
        res.send(parties);
    });
};

