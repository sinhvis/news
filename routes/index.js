var express = require('express');
var router = express.Router();

// For username / authentication
var passport = require('passport') ;


// for securing endpoints and associating comments
// with users
var jwt = require('express-jwt') ;


/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose') ;

// Import User mongoose model
var User = mongoose.model('User') ;

var Post = mongoose.model('Post') ;
var Comment = mongoose.model('Comment') ;

// Middleware for authenticating jwt tokens
// userProperty - 	which property on req to put payload
// 					from tokens
// secret - use same secret as the one in models/User.js
//			for generating tokens.
//			Hard-coding this token, must use 
//			environment variables for referencing secret.

var auth = jwt({ secret: 'SECRET', userProperty: 'payload' }) ;
// Retrieves all posts
router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts) {
		if(err) {return next(err) ; }

		res.json(posts) ;
	}) ;
}) ;


// POST route for creating posts
// auth - requires authentication for creating a post.
router.post('/posts', auth, function(req, res, next) {
	var post = new Post(req.body) ;

	// associate authors with posts
	// since authentication with JWT tokens,
	// get username directly from tokens' payload
	// this way don't need to go to the database.
	post.author = req.payload.username ;

	post.save(function(err, post) {
		if (err) { return next(err) ; }

		res.json(post) ;
	}) ;
}) ;

// This loads a post object by ID.
// Uses Express' param() function to automatically
// load an object.
// Pre-loads post objects
// This way, if router URL has :post in it,
// this function will be run first.
// If :post parameter has an ID, function will retrieve
// post object and attach it to req object, 
// after which route handler will be called.
router.param('post', function(req, res, next, id) {
	// Mongoose's query interface provides a flexible 
	// way of interacting with the database.
	var query = Post.findById(id) ;

	query.exec(function(err, post) {
		if(err) { return next(err) ; }
		if(!post) {
			return next(new Error('can\'t find post')) ;
		}

		req.post = post ;
		return next() ;
	}) ;
}) ;


// Middleware to load a comment object by ID
router.param('comment', function(req, res, next, id) {
	var query = Comment.findById(id) ;

	query.exec(function(err, comment) {
		if (err) { return next(err) ; }
		if (!comment) { return next(new Error("can't find comment")); }

		req.comment = comment ;
		return next() ;
	}) ;
}) ;


// route for returning a single post
// Middleware function (router.param)
// was used to retrieve a single post
// and attached to the req object
// request handler has to return JSON object
// back to the client.
// Using populate method to automatically load
// all comments associated with a particular post
router.get('/posts/:post', function(req, res) {
	req.post.populate('comments', function(err, post) {
		if (err) {return next(err) ; }

		res.json(post) ;
	})
}) ;

// router for upvote posts
// auth - require authentication for upvoting
router.put('/posts/:post/upvote', auth, function(req, res, next) {
	req.post.upvote(function(err, post) {
		if (err) { return next(err) ; }

		res.json(post) ;
	}) ;
}) ;

// router for comments route for a particular post
// auth - require authentication for commenting
// set the author for comments.
router.post('/posts/:post/comments', auth, function(req, res, next) {
	var comment = new Comment(req.body) ;
	comment.post = req.post ;

	// author field when creating comments
	// gets authors name directly from payload
	comment.author = req.payload.username ;

	comment.save(function(err, comment) {
		if(err) {return next(err) ; }

		req.post.comments.push(comment) ;
		req.post.save(function(err, post) {
			if(err) { return next(err) ; }

			res.json(comment) ;
		}) ;
	}) ;
}) ;

// auth - require authentication for upvoting comments
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
	req.comment.upvote(function(err, comment) {
		if (err) { return next(err) ; }

		res.json(comment) ;
	}) ;
}) ;

// Register route that creates a user given a 
// username and password
router.post('/register', function(req, res, next) {
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({ message: 'Please fill in out all fields' }) ;
	}

	var user = new User() ;

	user.username = req.body.username ;

	user.setPassword(req.body.password) ;

	user.save(function(err) {
		if(err) { return next(err) ; }

		return res.json({ token: user.generateJWT() })
	}) ;
}) ;

// Login route that authenticates user and returns
// token to client
router.post('/login', function(req, res, next) {
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({ message: 'Please fill in all fields' }) ;
	}

	passport.authenticate('local', function(err, user, info) {
		if(err) { return next(err) ; }

		if(user) {
			return res.json({ token: user.generateJWT() }) ;
		} else{
			return res.status(401).json(info) ;
		}
	}) (req, res, next) ;
}) ;

module.exports = router ;
