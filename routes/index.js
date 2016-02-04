var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose') ;
var Post = mongoose.model('Post') ;
var Comment = mongoose.model('Comment') ;



// Retrieves all posts
router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts) {
		if(err) {return next(err) ; }

		res.json(posts) ;
	}) ;
}) ;


// POST route for creating posts
router.post('/posts', function(req, res, next) {
	var post = new Post(req.body) ;

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
router.put('/posts/:post/upvote', function(req, res, next) {
	req.post.upvote(function(err, post) {
		if (err) { return next(err) ; }

		res.json(post) ;
	}) ;
}) ;

// router for comments route for a particular post
router.post('/posts/:post/comments', function(req, res, next) {
	var comment = new Comment(req.body) ;
	comment.post = req.post ;

	comment.save(function(err, comment) {
		if(err) {return next(err) ; }

		req.post.comments.push(comment) ;
		req.post.save(function(err, post) {
			if(err) { return next(err) ; }

			res.json(comment) ;
		}) ;
	}) ;
}) ;

router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
	req.comment.upvote(function(err, comment) {
		if (err) { return next(err) ; }

		res.json(comment) ;
	}) ;
}) ;

module.exports = router ;
