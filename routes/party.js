var mongoose        = require('mongoose');
var async           = require('async');
var util            = require('../models/util');
var db              = require('../db');
var Party           = mongoose.model('Party');
var User            = mongoose.model('User');
var Upvote          = mongoose.model('Upvote');

exports.postParty = function(req, res) {
    /* TODO: use address to check for duplicates */

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

    var date = util.checkDate(req.body.time);
    if (date == null) { return util.handleError("parseDate did not work on", req.body.time); }
  
    new Party({
        name        : req.body.name
      , description : req.body.description
      , owner       : req.session.userId
      , time        : req.body.time
      , address     : req.body.address
      , rating      : 0 // all parties start at rating 0
    }).save(function(err, data) {
        if (err) { return util.handleError("could not save the posted party", err); }
        res.send({ status: "OK" });
    });
};

exports.postUpvote = function(req, res) {
    console.log("inside postUpvote");
    new Upvote({
        owner       : req.session.userId
      , description : req.body.description
      , party       : req.body.partyId
    }).save(function(err, data) {
        if (err) { return util.handlerError("could not save posted upvote", err); }
        res.send({ status: "OK" });
    });
};

exports.getParty = function(req, res) {
    var partyId = req.query.partyId;
    var ret = {};
    async.parallel([
        function(callback) {
            Party.find({"_id":partyId}, function(err, party) {
                if (err) { return util.handleError("could not get party data", err); }
                if (party.length == 0) { return util.handleError(
                    "no party found - party id is invalid", ""); }
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

