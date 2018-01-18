//set up links to dependencies
const express = require('express');
const Twit = require('twit');
const config = require('./config');
const bodyParser = require('body-parser');
const moment = require('moment');
const app = express();

app.set('view engine', 'pug');

const T = new Twit(config);

//set up server
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const port = process.env.PORT || 3000;



//set static path for css use and bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')));




//start middleware . use twit to access Twitter
app.get('/', (req, res) => {
    T.get("account/verify_credentials").then(authUser => {
        const user = authUser.data.screen_name;
        //user promises to access each piece of information
        Promise.all([
            T.get('users/lookup', { screen_name: user }),
            T.get('statuses/user_timeline', { screen_name: user, count: 5 }),
            T.get('friends/list', { count: 5 }),
            T.get('direct_messages', { count: 5 })
        ])

        //take the data and extract information into objects
        .then(([userData, tweetData, friendData, messageData]) => {
            let currentData = {
                    user: getUser(userData.data),
                    tweets: getTweetData(tweetData.data),
                    friends: getFriendData(friendData.data),
                    messages: getMessageData(messageData.data)
                }
                //then render the layout getting the information from the currentData object
            return res.render('layout', currentData);
            //required catch blocks for promises
        }).catch(error => {
            throw error;
        })

    }).catch(error => {

        throw error;
    })

});

//start the server
server.listen(port, () => {
    console.log(`Server running on localhost:  ${port}`);
});


//=======================================================
//for extra credit : will complete later
// app.post('/', (req, res, next) => {
//     let message = req.body.tweet;
//     if (message.length <= 140) {
//         T.post('statuses/update', { status: tweet }, function(err, data, response) {
//             res.redirect('/');
//         });
//     } else {
//         let error = new Error('Must be shorter than 140 characters.');
//         next(error);
//     }
// });
//==========================================================


//functions for extracting information from the data
//extract the required user data
function getUser(data) {
    let user = data[0];
    let newUser = {};
    newUser.name = user.name;
    newUser.screen_name = user.screen_name;
    newUser.profile_image_url_https = user.profile_image_url_https;
    newUser.profile_banner_url = user.profile_banner_url;
    newUser.friends_count = user.friends_count;

    return newUser;
};
//get user's friend data
function getFriendData(data) {
    let friends = data.users;
    let allFriends = [];
    for (i = 0; i < friends.length; i++) {
        let friend = friends[i];
        let newFriend = {};
        newFriend.name = friend.name;
        newFriend.screen_name = friend.screen_name;
        newFriend.profile_image_url_https = friend.profile_image_url_https;
        allFriends.push(newFriend);
    }
    return allFriends;
};

//get user's tweet data for the timeline
function getTweetData(data) {
    let tweets = data;
    let allTweets = [];
    for (i = 0; i < tweets.length; i++) {
        let tweet = tweets[i];
        let newTweet = {};
        newTweet.name = tweet.user.name;
        newTweet.screen_name = tweet.user.screen_name;
        newTweet.profile_image_url_https = tweet.user.profile_image_url_https;
        newTweet.text = tweet.text;
        newTweet.favorite_count = tweet.favorite_count;
        newTweet.retweet_count = tweet.retweet_count;
        newTweet.created_at = tweet.created_at;
        newTweet.from_now = moment(new Date(tweet.created_at)).fromNow();
        allTweets.push(newTweet);
    }

    return allTweets;
};

//get user's direct message data
function getMessageData(data) {
    let messages = data;
    let allMessages = [];
    for (i = 0; i < messages.length; i++) {
        let newMessage = {};
        let message = messages[i];
        newMessage.text = message.text;
        newMessage.created_at = message.created_at;
        newMessage.sender_name = message.sender.name;
        newMessage.sender_screen_name = message.sender.screen_name;
        newMessage.sender_profile_image_url_https = message.sender.profile_image_url_https;
        newMessage.from_now = moment(new Date(message.created_at)).fromNow();
        allMessages.push(newMessage);
    }

    return allMessages;
};