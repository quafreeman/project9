'use strict';

var express = require("express"); 
var router = express.Router(); 
const Course = require("../models/course");
const User = require("../models/user");
const bcrypt = require('bcryptjs');
const auth = require('basic-auth');



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
    res.status(401).json({ "Authentication error": "Course cannot be created without entering a username and password" });
  }
  };


//This checks to see if logged in email address matches email address assigned to a course
  const authenticateCourseUser = (req, res, next) => {
     Course.findById(req.params.id).populate('user', "emailAddress").exec(function (err, course){
            const currentUser = req.currentUser.emailAddress;
            const courseUser = course.user.emailAddress;
            if (currentUser === courseUser) {
              next();
            } else {
              err = new Error('Sorry, the correct user must be signed in to update this course');
              err.status = 403;
              next(err);
            }
          });
  
  };
//GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get('/', (req, res, next) => {
    Course.find({})
          .populate('user', 'firstName lastName')
          .sort({ _id : 1 })
          .exec((err, courses) => {
            if(err) return next(err);
            res.json(courses);
          });
  });


// GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get('/:id', (req, res, next) => {
    Course.findById(req.params.id)
          .populate('user', 'firstName lastName')
          .exec((err, courses) => {
            if(err) return next(err);
            if(courses) {
              res.status(200).json(courses);
            } else {
              res.status(404).json(`Course ${req.params.id} does not exist!`)
            };
          });
  });
// POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/', authenticateUser, (req, res, next) => {
    const course = new Course({
        user: req.body.user,
        title: req.body.title, 
        description: req.body.description, 
        estimatedTime: req.body.estimatedTime, 
        materialsNeeded: req.body.materialsNeeded
    });

    course
    .save()
    .then(result => {
        console.log(result);  
        res.location('/'); 
        res.status(201).json('A new course has been created') 
})
    .catch(err => {
        console.log(err);
        res.status(400).json({
            error: err
        });
    });
});

// PUT/api/courses/:id 204 - updates a course and returns no content
router.put("/:id", authenticateUser, authenticateCourseUser, (req, res, next) => {
      Course.findOneAndUpdate(
        ({_id: req.params.id}),
        {
          $set: {
            title: req.body.title,
            description: req.body.description,
            estimatedTime: req.body.estimatedTime,
            materialsNeeded: req.body.materialsNeeded
          }
        })
      .exec(function(error, course) {
        if (error) {
          console.log(error);
          console.log(403);
          return next();
        } else {
          console.log("Course has been updated!");
          return res.sendStatus(204);
        }
      
      });
    });



// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete('/:id', authenticateUser, authenticateCourseUser, (req, res, next) => {
    const id = req.params.id;
    Course.deleteOne({_id: id})
    .exec()
    .then(result => {
        res.status(204).json(result);
    })
    .catch(err => {
        console.log(err);n
        res.status(403).json({
            error: err
        });
    });
    
    });



  module.exports = router;