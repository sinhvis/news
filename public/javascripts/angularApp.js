var app = angular.module('news', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainCtrl',
            // resolve property of ui-router ensures
            // posts are loaded when home state is loaded.
            resolve: {
                postPromise: ['posts',function(posts) {
                    return posts.getAll() ;
                }]
            }
        }) 

        .state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            controller: 'PostsCtrl'
        }) ;

        $urlRouterProvider.otherwise('home');
    }]) ;

// Need to inject $http service to query posts route.
app.factory('posts', ['$http', function($http){
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
        return $http.post('/posts', post).success(function(data) {
            o.posts.push(data) ;
        }) ;
    } ;

    // method for upvotes
    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote')
        .success(function(data) {
            post.upvotes += 1 ;
        }) ;
    } ;

    // retrieve a single post from server
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res) {
            return res.data ;
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
                title: $scope.title,
                link: $scope.link,
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
    '$stateParams',
    'posts',
    function ($scope, $stateParams, posts) {
        $scope.post = posts.posts[$stateParams.id] ;

        $scope.addComment = function() {
            if ($scope.body === '') { return ;}

            $scope.post.comments.push({
                body:       $scope.body,
                author:     'user',
                upvotes:    0
            }) ;
        } ;
    }]) ;