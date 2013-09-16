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
