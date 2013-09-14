var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    email       : { type: String, unique: true, required: true }
  , name        : { 
                      first     : String
                    , last      : String
                  }
  , friends     : [{ type: Schema.ObjectId, ref: 'User' }]
});
userSchema.plugin(require('basic-auth-mongoose'));

var partySchema = new Schema({
    name        : { type: String, required: true }
  , description : String
  , owner       : { type: Schema.ObjectId, ref: 'User' }
  , time        : { type: Date, default: Date.now }
  , address     : {
                      street    : String
                    , city      : String
                    , state     : String
                    , country   : String
                    , zip       : String
                  }
  , rating      : { type: Number, required: true }
});

var upvoteSchema = new Schema({
    owner       : { type: Schema.ObjectId, ref: 'User' }
  , description : String
  , party       : { type: Schema.ObjectId, ref: 'Party' }
}); 

var friendRequestStatus = {
    PENDING     : 0
  , ACCEPTED    : 1
  , REJECTED    : 2
}

var friendRequestSchema = new Schema({
    from        : { type: Schema.ObjectId, ref: 'User' }
  , to          : { type: Schema.ObjectId, ref: 'User' }
  , state       : Number
});

var User = mongoose.model('User', userSchema);
var Party = mongoose.model('Party', partySchema);
var Upvote = mongoose.model('Upvote', upvoteSchema);

mongoose.connect('mongodb://localhost/hopper_v1');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
    console.log("mongodb is connected!");

    // development mongo script

    // clear db
    var clearDb = true;
    if (clearDb) {
        User.remove({}, function(err) {
            if (err) {
                console.log("ERROR Could not remove 'User' collection: "+ err);
                return;
            } 
        });
        Party.remove({}, function(err) {
            if (err) {
                console.log("ERROR Could not remove 'Party' collection: "+ err);
                return;
            } 
        });
        Upvote.remove({}, function(err) {
            if (err) {
                console.log("ERROR Could not remove 'Upvote' collection: "+ err);
                return;
            } 
        });
    }

    // add dummy users such that:
    //      dummyUser01 is friends with dummyUser02 & dummyUser03
    //      dummyUser02 is friends with dummyUser01
    //      dummyUser03 is friends with dummyUser01
    var dummyUsers = [];
    var dummyUser01 = new User({
        username: "jstan"
      , password: "jstan"
      , email   : "jtan@jtan.com"
      , name    : {
                      first : "js"
                    , last  : "tan"
                  }
      , friends : []
    });
    dummyUsers.push(dummyUser01);

    var dummyUser02 = new User({
        username: "lukas"
      , password: "lukas"
      , email   : "lukas@lukas.com"
      , name    : {
                      first : "lukas"
                    , last  : "bentel"
                  }
      , friends : []
    });
    dummyUsers.push(dummyUser02);

    var dummyUser03 = new User({
        username: "kevin"
      , password: "kevin"
      , email   : "kevin@kevin.com"
      , name    : {
                      first : "kevin"
                    , last  : "wiesner"
                  }
      , friends : []
    });
    dummyUsers.push(dummyUser03);

    var dummyUser04 = new User({
        username: "koji"
      , password: "koji"
      , email   : "koji@koji.com"
      , name    : {
                      first : "koji"
                    , last  : "yamamoto"
                  }
      , friends : []
    });
    dummyUsers.push(dummyUser04);

    dummyUser01.friends = [dummyUser02._id, dummyUser03._id];
    dummyUser02.friends = [dummyUser01._id];
    dummyUser03.friends = [dummyUser01._id];
    dummyUser04.friends = [];

    for (var i in dummyUsers) {
        dummyUsers[i].save(function(err, user) {
            if (err) {
                console.log("ERROR Could not save user: " + err);
                return;
            }
        });
    }

    // dummy Party data such that:
    //      dummyUser01 has party 1
    //      dummyUser02 has party 2
    var dummyParties = [];
    var dummyParty01 = new Party({
        name        : "js's party"
      , description : "this is a party for js"
      , owner       : dummyUser01._id
      , time        : Date.now()
      , address     : {
                          street    : "30 Congdon"
                        , city      : "Providence"
                        , state     : "RI" 
                        , country   : "America" 
                        , zip       : "02912" 
                      }
      , rating      : 92
    });
    dummyParties.push(dummyParty01);

    var dummyParty02 = new Party({
        name        : "lukas's party"
      , description : "this is a party for lukas"
      , owner       : dummyUser02._id
      , time        : Date.now()
      , address     : {
                          street    : "locust valley"
                        , city      : "Long Island"
                        , state     : "NY"
                        , country   : "America"
                        , zip       : "02231"
                      }
      , rating      : 49
    });
    dummyParties.push(dummyParty02);

    for (var i in dummyParties) {
        dummyParties[i].save(function(err, party) {
            if (err) {
                console.log("ERROR Could not save party: " + err);
                return;
            }
        });
    }

    // dummy Upvote data such that:
    //      dummyUpvote01 is by dummyUser01 for dummyParty01
    //      dummyUpvote02 is by dummyUser01 for dummyParty02
    //      dummyUpvote03 is by dummyUser02 for dummyParty02
    //      dummyUpvote04 is by dummyUser02 for dummyParty01
    //      dummyUpvote05 is by dummyUser03 for dummyParty01
    var dummyUpvotes = [];
    var dummyUpvote01 = new Upvote({
        owner       : dummyUser01._id
      , description : "upvote by js for js's party"
      , party       : dummyParty01._id        
    });
    dummyUpvotes.push(dummyUpvote01);

    var dummyUpvote02 = new Upvote({
        owner       : dummyUser01._id
      , description : "upvote by js for lukas's party"
      , party       : dummyParty02._id
    });
    dummyUpvotes.push(dummyUpvote02);

    var dummyUpvote03 = new Upvote({
        owner       : dummyUser02._id
      , description : "upvote by lukas for lukas's party"
      , party       : dummyParty02._id
    });
    dummyUpvotes.push(dummyUpvote03);

    var dummyUpvote04 = new Upvote({
        owner       : dummyUser02._id
      , description : "upvote by lukas for js's party"
      , party       : dummyParty01._id
    });
    dummyUpvotes.push(dummyUpvote04);

    var dummyUpvote05 = new Upvote({
        owner       : dummyUser03._id
      , description : "upvote by kevin for js's party"
      , party       : dummyParty01._id
    });
    dummyUpvotes.push(dummyUpvote05);

    for (var i in dummyUpvotes) {
        dummyUpvotes[i].save(function(err, upvote) {
            if (err) {
                console.log("ERROR Could not save upvote: " + err);
                return;
            }
        });
    }


});
