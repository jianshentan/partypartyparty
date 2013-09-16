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

