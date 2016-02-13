var app = angular.module('news', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider
        .state('home', {
            url:            '/home',
            templateUrl:    '/home.html',
            controller:     'MainCtrl',
            // resolve property of ui-router ensures
            // posts are loaded when home state is loaded.
            resolve: {
                postPromise: ['posts',function(posts) {
                    return posts.getAll() ;
                }]
            }
        }) 

        .state('posts', {
            url:            '/posts/{id}',
            templateUrl:    '/posts.html',
            controller:     'PostsCtrl',
            resolve: {
                post: ['$stateParams', 'posts', function($stateParams, posts) {
                    return posts.get($stateParams.id) ;
                }]
            }
        })

        // state for login
        // onEnter function: detects if the user is 
        // authenticated before entering the state
        // redirect them back to home if already logged in.
        .state('login', {
            url:            '/login',
            templateUrl:    '/login.html',
            controller:     'AuthCtrl',
            onEnter:        ['$state', 'auth', function($state, auth) {
                if(auth.isLoggedIn()) {
                    $state.go('home') ;
                }
            }]
        })

        // state for register
        .state('register', {
            url:            '/register',
            templateUrl:    '/register.html',
            controller:     'AuthCtrl',
            onEnter:        ['$state', 'auth', function($state, auth) {
                if(auth.isLoggedIn()) {
                    $state.go('home') ;
                }
            }]
        }) ;

        $urlRouterProvider.otherwise('home');
    }]) ;

// Using localStorage for persisting data to client
// If JWT token exits in localStorage, then user is logged in.
// as long as the token isn't expired.
// To log out remove token from localStorage
// Need to inject $http for interfacing with server.
// Need $window for interfacing with localStorage
app.factory('auth', ['$http', '$window', function($http, $window) {
    var auth = {} ;

    // saveToken for setting token to localStorage
    auth.saveToken = function(token) {
        $window.localStorage['news-token'] = token ;
    } ;

    // getToken for getting token from localStorage
    auth.getToken = function(token) {
        return $window.localStorage['news-token'] ;
    }

    // if token exits, check payload to see if 
    // token has expired.
    // payload is the middle part of the token 
    // between the two .s.  It's a JSON object
    // that been base74'd
    // get back the payload to a stringified JSON
    // by using $window.atob(), and then back to 
    // a JavaScript object with JSON.parse.
    auth.isLoggedIn = function() {
        var token = auth.getToken() ;

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1])) ;

            return payload.exp > Date.now() / 1000 ;
        } else {
            return false ;
        }
    } ;

    // returns the username of the user that's logged in.
    auth.currentUser = function() {
        if(auth.isLoggedIn()) {
            var token = auth.getToken() ;
            var payload = JSON.parse($window.atob(token.split('.')[1])) ;

            return payload.username ;
        }
    } ;

    // register function posts user to /register route
    // and saves token returned
    auth.register = function(user) {
        return $http.post('/register', user).success(function(data) {
            auth.saveToken(data.token) ;
        }) ;
    } ;

    // login function posts user to /login route
    // and saves token returned
    auth.logIn - function(user) {
        return $http.post('/login', user).success(function(data) {
            auth.saveToken(data.token) ;
        }) ;
    } ;

    // logout function that removes user's token from
    // localStorage logging the user out.
    auth.logOut = function() {
        $window.localStorage.removeItem('news-token');
    } ;

    return auth ;
}]) ;

// Need to inject $http service to query posts route.
// Need to send JWT token to server on authenticated
// requests.  Done by injecting auth
// The JWT token needs to be sent as an Authorization header
// Format of this header:
// Authorization: Bearer TOKEN.GOES.HERE
// That object gets passed as the last argument for 
// $http calls for create, upvote, addComment, and upVoteComment
// methods in post service
app.factory('posts', ['$http', 'auth', function($http, auth){
    var o = {
        posts: []
    } ;

    // query /posts route and bind a function when request returns
    // gets back a list and copy to posts object using angular.copy()
    // angular.copy() returns deep copy of returned data.  
    // Then $scope.posts in MainCtrl will also be updated.
    // So, new values are reflected in the view.
    o.getAll = function() {
        return $http.get('/posts').success(function(data) {
            angular.copy(data, o.posts) ;
        }) ;
    } ;

    // create new posts
    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data) {
            o.posts.push(data) ;
        }) ;
    } ;

    // method for upvotes
    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data) {
            post.upvotes += 1 ;
        }) ;
    } ;

    // retrieve a single post from server
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res) {
            return res.data ;
        }) ;
    } ;

    // adding comments
    o.addComment = function(id, comment) {
        
        return $http.post('/posts/' + id + '/comments', comment) ;
    } ;

    // upvoting of comments
    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote')
        .success(function(data) {
            comment.upvotes += 1 ;
        }) ;
    } ;

    return o;
}]) ;

app.controller('MainCtrl', [
    '$scope',
    'posts',
    function($scope, posts){
        $scope.posts = posts.posts;
        $scope.addPost = function(){
            if(!$scope.title || $scope.title === '') { return ; }

            // save posts to the server
            posts.create({
                title:  $scope.title,
                link:   $scope.link,
            }) ;

            // $scope.posts.push({
            //     title: $scope.title,
            //     link: $scope.link,
            //     upvotes: 0,
            //     comments: [
            //     {author: 'Joe', body: 'Cool post!', upvotes: 0},
            //     {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
            //     ]
            // }) ;

$scope.title = '';
$scope.link = '';
}

$scope.incrementUpvotes = function(post){
    posts.upvote(post) ;
} ;
}]);

app.controller('PostsCtrl', [
    '$scope',
    'posts',
    'post',
    function ($scope, posts, post) {
        // $scope.post = posts.posts[$stateParams.id] ;
        $scope.post = post ;

        $scope.addComment = function() {
            if ($scope.body === '') { return ; }

            posts.addComment(post._id, {
                body:   $scope.body,
                author: 'user',
            }).success(function(comment) {
                $scope.post.comments.push(comment) ;
            }) ;
            $scope.body = '' ;

            // $scope.post.comments.push({
            //     body:       $scope.body,
            //     author:     'user',
            //     upvotes:    0
            // }) ;
} ;

$scope.incrementUpvotes = function(comment) {
    posts.upvoteComment(post, comment) ;
} ;
}]) ;

// Authentication Controller
// Initialize user on $scope for our form
// Create register and logIn() methods on scope
// to call the respective methods on auth factory
// Handle any errors and set $scope.error for 
// displaying error messages later.
// If not errors occur, send user back to home state
// using a promise.
app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function($scope, $state, auth) {
        $scope.user = {} ;

        $scope.register = function() {
            auth.register($scope.user).error(function(error) {
                $scope.error = error ;
            }).then(function() {
                $state.go('home') ;
            }) ;
        } ;

        $scope.logIn = function() {
            auth.logIn($scope.user).error(function(error) {
                $scope.error = error ;
            }).then(function() {
                $state.go('home') ;
            }) ;
        } ;
    }]) ;


// Controller for navbar that exposes 
// isLoggedIn, currentUser and logOut methods from 
// auth factory
app.controller('NavCtrl', [
    '$scope',
    'auth',
    function($scope, auth) {
        $scope.isLoggedIn = auth.isLoggedIn ;
        $scope.currentUser = auth.currentUser ;
        $scope.logOut = auth.logOut ;
    }]) ;