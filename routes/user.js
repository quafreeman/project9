'use strict'
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const auth = require('basic-auth');
const salt = bcrypt.genSaltSync(10);


//Middleware 
const authenticateUser = (req, res, next) => {
  if (auth(req)) {
    User.findOne({ emailAddress: auth(req).name }, function(err, user) {
  
      // If the user is found:
      if (user) {
        const authenticated = bcrypt.compareSync(auth(req).pass, user.password);
  
        // If the passwords match:
        if (authenticated) {
          console.log(`Authentication successful for username: ${user.emailAddress}`);
          req.currentUser = user;
          next();
        // If the passwords doesn't match:
        } else {
          err = new Error("Authentication failure, invalid username and/or password!");
          err.status = 401;
          next(err);
        }
      // If the user is not found:
      } else {
        err = new Error("Authentication failure, invalid username and/or password!");
        err.status = 401;
        next(err);
      }
    })
  } else {
    res.status(401).json({ "Authentication Error": "User email address and password are required" });
  }
  };
  


//POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post('/', (req, res, next) => {
const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
if( emailRegex.test(req.body.emailAddress) ){ //This makes sure that the email address entered is in the proper format
  
  if(req.body.firstName&&
           req.body.lastName&&
           req.body.emailAddress&&
           req.body.password){

      const userData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailAddress: req.body.emailAddress,
        password: bcrypt.hashSync(req.body.password, salt)
     }

      User.create(userData, function(error){
        if(error){
          return next(error);
        } else {
          res.location('/');
          res.sendStatus(201);
        }
      });

     } else {
      let error = new Error('All User fields are required to create a new user.');
      error.status = 400;
      return next(error); 
     }

} else {
  let error = new Error('Invalid email address format'); //if the email address is not properly formatted an error is thrown.
  error.status = 400;
  return next(error); 
}
});


//GET /api/users 200 - Returns the currently authenticated user
router.get('/', authenticateUser, (req, res, next) => {
const user = req.currentUser;
res.json(user);
});

module.exports = router;