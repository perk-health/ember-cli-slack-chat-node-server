var Slack = require('slack-node');
var express = require('express');
var bodyParser = require('body-parser');

// Setup Slack API
var slackApiToken = process.env.SLACK_API_TOKEN;
var slack = new Slack(slackApiToken);

// Setup users you want to invite the created channel
// Find user ID:s here https://api.slack.com/methods/users.list/test
var supportUserIds = ['U0AL3FV6U'];

// Setup Express
var app = express();
app.set('port', (process.env.PORT || 1337))

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var server = app.listen( app.get('port'), function() {
  console.log('Express listening at http://%s:%s', server.address().address, server.address().port);
});

// Express app configs
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Allow crossdomain
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});

// Query messages
app.get('/channel/:id/messages', function(req, res, next) {
  if( req.params.id ) {
    slack.api('channels.history', {
      channel: req.params.id,
      oldest: req.query.oldest
    }, function(err, response) {
      res.send(response);
    });
  } else {
    res.send({ error : 'Data missing'});
  }
});

// Create channel
app.post('/channels', function(req, res, next) {
  slack.api('channels.create', {
    name: req.body.channel
  }, function(err, response) {
    res.send(response);

    // Invite extra users
    supportUserIds.forEach(function(userid) {
      slack.api('channels.invite', {
        channel: response.channel.id,
        user: userid
      });
    });
  });
});

// Send message
app.post('/message', function(req, res, next) {
  if( req.body.message && req.body.channel ){
    slack.api('chat.postMessage', {
      text:req.body.message,
      channel: req.body.channel,
      attachments: req.body.attachments
    }, function(err, postMessageResponse){
      res.send(postMessageResponse);
    });
  } else{
    res.send({ error : 'Data missing'});
  }
});

// Test that the server is working.
app.get('/', function(request, response) {
  response.render('pages/index');
});
