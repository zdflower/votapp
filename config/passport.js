'use strict';

var GitHubStrategy = require('passport-github').Strategy;
var Usuario = require('../models/usuario');
var configAuth = require('./auth');

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    Usuario.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new GitHubStrategy({
    clientID:configAuth.githubAuth.clientID,
    clientSecret:configAuth.githubAuth.clientSecret,
    callbackURL:configAuth.githubAuth.callbackURL
  },
  function (token, refreshToken, profile, done){
    process.nextTick(function(){
      Usuario.findOne({'github.id': profile.id},
      function (err, user) {
        if (err){
          return done(err);
        }
        if (user) {
          return done(null, user);
        }
        else {
          var newUser = new Usuario();
          newUser.github.id = profile.id;
          newUser.github.username = profile.username;
          newUser.github.displayName = profile.displayName;
          newUser.local.username = profile.username;
          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            return done(null, newUser);
          });
        }
      });
    });
  }));
};
