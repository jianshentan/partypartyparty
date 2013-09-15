partypartyparty
===============

======================================================================
                           GETTING STARTED 
======================================================================

installation:
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

======================================================================
                            BACK END API
======================================================================

Sessions are created on login
req.session:
{
    userId: <ObjectId from MongoDb>
}

Http queries:
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

'/start/login':
    POST request
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
        [ { <userSchema> } ]

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
        adds requesting user to current user's friend list
        adds current user to requesting user's friend list
    expects:
        req.session.userId = <userId>
        req.query.friend = <userId>
    return: empty // some kind of success message
