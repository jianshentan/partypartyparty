
##GETTING STARTED

####Installation:
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

####to run:
1. run "nodemon app.js"


##DB SCHEMAS

    userSchema = {
        email   : String (NOT NULL, UNIQUE) 
      , username: String (NOT NULL, UNIQUE)
      , friends : [ ObjectIds of User ]
      , status  : socialStatus 
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

    socialStatus = {{AWKWARD_TURTLE:0}, {SOCIAL_BUTTERFLY:1}}
    friendRequestStatus = {{PENDING:0}, {ACCEPTED:1}, {REJECTED:2}}

##BACK END API

####Conventions:
all data is returned from the server as a JSON
if the request is successful, the server will return { status: "OK" }
if the server does not return a response, assume an error occurred

####Others:
Sessions are created on login
req.session:
{
    userId: <ObjectId from MongoDb>
}

###Routes
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

###Auth
    '/getSelf':
        GET request
        description:
            this call is for testing purposes
            gets username of session._id
        return: 
            { 
                status: <string> "OK" || "ERROR"
              , message: <string> (username is in string) 
            }

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
            {
                status: <string> ("OK" || "ERROR")
              , message: <string> ("Login sucessful" ||
                                   "Email does not exist" ||
                                   "Invalid password")
              , content:  // content dne empty if status != "OK"
                    {
                        email: <string>
                      , username: <string>
                    }
            }

    '/start/logout':
        POST request
        description:
            deletes session
        expects: empty
        return: 
            {
                status: <string> ("OK")
            }

    '/start/signup':
        POST request
        description:
            generates session
        expects:
            req.body = {
                username: <string>
              , password: <string>
              , email: <string>
            }
        returns:
            {
                status: <string> ("OK" || "ERROR")
              , message: <string> ("Signup sucessful" ||
                                   "Email already in use" ||
                                   "Username already in use")
              , content:  // content dne empty if status != "OK"
                    {
                        email: <string>
                      , username: <string>
                    }
            }
        
###Party
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
        returns: 
            { 
                status: <string> ("OK") 
            } 

    '/postUpvote':
        POST request
        expects:
            req.body = {
                description: <string>
                partyId: <string>
            }
            req.session.userId = <userId>
        return:
            { 
                status: <string> ("OK") 
            }

    '/getParty':
        GET request
        expects:
            req.query.partyId: <string>
        returns: 
            {
                status: <string> ("OK")
              , party: { <partySchema> }
              , upvotes: [ { <upvoteSchema> } ]
            }

    '/getParties':
        GET request
        expects:
            req.session.userId = <userId>
        returns:
            {
                status: <string> ("OK")
              , parties: [ <partySchema> ]
            }

###Friend
    '/getFriend':
        GET request
        description:
            this request gets the data for opening a friend's profile
        expects:
            req.query.friendId = <userId>
        returns:
            {
                status: <string> ("OK")
              , friend: { <userSchema> }
              , upvotes: [ { <upvoteSchema> } ]
            }

    '/getFriends':
        GET request
        expects:
            req.session.userId = <userId>
        returns:
            {
                status: <string> ("OK")
              , friends: [ { <userSchema> } ]
            }

    '/findUser':
        GET request
        description:
            finds all users based on the input string
            returns both user data and the state of their relationship
            note: this function returns an array of users that fit the input string
                typically, there should only be one user in the array
        expects:
            req.query.input = <string>
        returns:
            {
                status: <string> ("OK")
              , users: [ { user: <userSchema>, requestState: <friendRequestSchema> } ]
                       if no friend-request is shared, 'requestState' will equal null
            }

    '/sendFriendRequest':
        GET request
        expects:
            req.session.userId = <userId>
            req.query.friend = <userId>
        returns: 
            {
                status: <string> ("OK")
            }

    '/getFriendRequests':
        GET request
        description:
            returns a list of users who have requested to be friends with the querying user
        expects:
            req.session.userId = <userId>
        returns: 
            {
                status: <string> ("OK")
              , users: [ { <userSchema> } ]
            }

    '/getPendingRequests': 
        GET request
        description:
            returns a list of users who have been sent a request by the querying user
        expects:
            req.session.userId = <userId>
        returns: 
            {
                status: <string> ("OK")
              , users: [ { <userSchema> } ]
            }

    '/acceptFriendRequest':
        GET request
        description:
            change state of friendRequest to ACCEPT
            adds requesting user to current user's friend list
            adds current user to requesting user's friend list
        expects:
            req.session.userId = <userId>
            req.query.friend = <userId>
        return: 
            {
                status: <string> ("OK")
            }

    '/declineFriendRequest':
        GET request
        description:
            change state of friendRequest to DECLINED
        expects:
            req.session.userId = <userId>
            req.query.friend = <userId>
        return:
            {
                status: <string> ("OK")
            }

