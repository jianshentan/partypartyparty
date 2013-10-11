var mongoose        = require('mongoose');
var async           = require('async');
var util            = require('../models/util');
var db              = require('../db');
var User            = mongoose.model('User');

exports.auth = function(req, res, next) {
    if (req.session && req.session.userId) {
        User.find({"_id":req.session.userId}, function(err, user) {
            if (err) { return util.handleError("could not retreive user", err); }
            if (user) {
                next();
            } else {
                // code should never reach here
                return util.handleError(
                    "no user found with valid session userId: ", req.session.userId);
            }
        });
    } else {
        res.send("action cannot be done - user is not logged in");
    }
};

exports.login = function(req, res) {
    var LOGIN_SUCCESS   = "Login successful"
      , EMAIL_FAIL      = "Email does not exist"
      , PASSWORD_FAIL   = "Invalid password";

    User.findOne({"email": req.body.email}, function(err, user) {
        if (err) { return util.handleError("could not find user by email", err); }
        if (!user) {
            res.send(
                {
                    status: "ERROR"
                  , message: req.body.email + " - " + EMAIL_FAIL
                });
            return;
        } else {
            if (user.authenticate(req.body.password)) {
                req.session.userId = user.id;
                res.send(
                    {
                        status: "OK"
                      , message: LOGIN_SUCCESS
                      , content: 
                        {
                            username: user.username
                          , email: user.email
                        }
                    });
            } else {
                res.send(
                    {
                        status: "ERROR"
                      , message: PASSWORD_FAIL
                    });
            }
        }
    });
};

exports.logout = function(req, res) {
    delete req.session.userId; 
    res.send({ status: "OK" });
};

exports.signup = function(req, res) {
    var USERNAME_DUPLICATE = "this username is already in use"
      , EMAIL_DUPLICATE    = "this email is already in use"
      , USER_SAVED         = "new user is saved!";

    async.series([
        function(callback) {
            User.findOne({ $or: [{username: req.body.username},
                                 {email: req.body.email}] },
                function(err, user) {
                if (err) { return util.handleError("could not query user", err); }
                if (user) {
                    if (user.username == req.body.username)
                        res.send(
                            { 
                                status: "ERROR"
                              , message: USERNAME_DUPLICATE 
                            });
                    if (user.email == req.body.email)
                        res.send(
                            { 
                                status: "ERROR"
                              , message: EMAIL_DUPLICATE 
                            });
                } else
                    callback();
            });
        },
        function(callback) {
            new User({
                username : req.body.username
              , password : req.body.password
              //, name : {
              //             first : req.body.firstname
              //           , last : req.body.lastname
              //         }
              , email : req.body.email
              , friends : []
              , status : db.socialStatus.AWKWARD_TURTLE
            }).save(function(err, user) {
                if (err) { return util.handleError("could not sign up new user", err); }
                req.session.userId = user.id;
                res.send(
                    {
                        status: "OK"
                      , message: USER_SAVED
                      , content: 
                        {
                            username: user.username
                          , email: user.email
                        }
                    });
            });
        }
    ], function(err) {
        if (err) { return util.handleError("could not register", err); }
    });
};

exports.getSelf = function(req, res) {
    User.findOne({"_id":req.session.userId}, function(err, user) {
        if (err) { return util.handleError("could not retreive user", err); }
        if (user) 
            res.send(user.username);
        else
            res.send("Not logged in");
    });
};
