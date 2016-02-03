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
// Use Express' param() function to automatically
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

// route for returning a single post
// Middleware function (roiuter.param)
// was used to retrieve a single post
// and attached to the req object
// request handler has to return JSON object
// back to the client.
router.get('/posts/.post', function(req, res) {
	res.json(req.post) ;
}) ;

// router for upvote posts
router.put('/posts/:post/upvote', function(req, res, next) {
	req.post.upvote(function(err, post) {
		if (err) { return next(err) ; }

		res.json(post) ;
	}) ;
}) ;
module.exports = router ;
