
                           ##GETTING STARTED##
======================================================================

Installation:
1. install node 
2. install mongodb
3. package.json should look like the following:
        {    
          "name": "application-name",
          "version": "0.0.1",
          "private": true,
          "scripts": {
            "start": "node app.js"
          },
          "dependencies": {
            "express": "3.4.0",
            "mongoose": "3.4.x",
            "jade": "*",
            "async": "*",
            "basic-auth-mongoose": "~0.1.1"
          }
        }
4. run npm install

to run:
1. run "nodemon app.js"

----------------------------------------------------------------------

                            ##DB SCHEMAS##
======================================================================
userSchema = {
    email   : String 
  , name    : {
                  first : String
                , last  : String
              }
  , friends : [ ObjectIds of User ]
};

partySchema = {
    name        : String
  , description : String
  , owner       : ObjectId of User
  , time        : Date
  , address     : {
                      street    : String
                    , city      : String
                    , state     : String
                    , country   : String
                    , zip       : String
                  }
  , rating      : Number
}

upvoteSchema = {
    owner       : ObjectId of User
  , description : String
  , party       : ObjectId of Party
}

friendRequestSchema = {
    from    : ObjectId of User
  , to      : ObjectId of User
  , state   : friendRequestStatus
}

friendRequestStatus = {PENDING, ACCEPTED, REJECTED}

----------------------------------------------------------------------

                          ##BACK END API##
======================================================================

Sessions are created on login
req.session:
{
    userId: <ObjectId from MongoDb>
}

###Routes###
'/' :
    GET request
    description:
        requires authentication
    return:
        redirection:
            if session has user id -> '/'
            else -> '/start'

'/start':
    GET request
    prompts login
    return: empty

###Auth###
'/start/login':
    POST request
    description:
        generates session
    expects:
        req.body = {
            email: <string>
          , password: <string>
        }
    return: 
        redirection:
            if success -> '/' 
            else -> '/start'

'/start/logout':
    POST request
    description:
        deletes session
    expects: empty
    return: empty

'/start/signup':
    POST request
    description:
        generates session
    expects:
        req.body = {
            username: <string>
          , password: <string>
          , firstname: <string>
          , lastname: <string>
          , email: <string>
        }
    returns:
        redirection:
            if success -> '/'
            else -> '/start'
        
###Party###
'/postParty':
    POST request 
    expects:
        req.body = {
            name: <string>
          , description: <string>
          , time: "yyyy-mm-dd hh:mm:ss"
          , address: {
                street: <string>
              , city: <string>
              , state: <string>
              , country: <string>
              , zip: <string>
            }
        }
        req.session.userId = <userId>
    returns: empty

'/postUpvote':
    POST request
    expects:
        req.body = {
            description: <string>
            partyId: <string>
        }
        req.session.userId = <userId>
    return: empty

'/getParty':
    GET request
    expects:
        req.query.partyId: <string>
    returns: 
        {
            party: { <partySchema> }
          , upvotes: [ { <upvoteSchema> } ]
        }

'/getParties':
    GET request
    expects:
        req.session.userId = <userId>
    returns:
        [ <partySchema> ]

###Friend###
'/getFriend':
    GET request
    expects:
        req.query.friendId = <userId>
    returns:
        {
            friend: { <userSchema> }
          , upvotes: [ { <upvoteSchema> } ]
        }

'/getFriends':
    GET request
    expects:
        req.session.userId = <userId>
    returns:
        [ { <userSchema> } ]

'/findUser':
    GET request
    expects:
        req.query.input = <string>
    returns:
        [ { user: <userSchema>, requestState: <friendRequestSchema> } ]
        if no friend-request is shared, 'requestState' will simply equal null

'/sendFriendRequest':
    GET request
    expects:
        req.session.userId = <userId>
        req.query.friend = <userId>
    returns: empty

'/getFriendRequests':
    GET request
    expects:
        req.session.userId = <userId>
    returns: 
        [ { <userSchema> } ]

'/getPendingResponses': 
    GET request
    expects:
        req.session.userId = <userId>
    returns: empty

'/acceptFriendRequest':
    GET request
    description:
        change state of friendRequest to ACCEPT
        adds requesting user to current user's friend list
        adds current user to requesting user's friend list
    expects:
        req.session.userId = <userId>
        req.query.friend = <userId>
    return: empty // some kind of success message

'/declineFriendRequest':
    GET request
    description:
        change state of friendRequest to DECLINED
    expects:
        req.session.userId = <userId>
        req.query.friend = <userId>
    return: empty // some kind of success message

