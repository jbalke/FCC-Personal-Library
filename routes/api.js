/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

var hex = /[0-9A-Fa-f]{24}/;

module.exports = function (app) {

  MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
    console.log('database connected');
    
    const collection = db.collection('library');
    
    app.route('/api/books')
      .get(function (req, res){
        //response will be array of book objects
        //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      
        collection.find({}).toArray()
          .then(result => {
            res.json(result);
          })
          .catch(err => { res.json([]) });
      })

      .post(function (req, res){
        var title = req.body.title;
        //response will contain new book object including at least _id and title
      
        if (!title) return res.type('txt').send('must provide title');
      
        collection.insertOne({title, commentcount: 0, comments: []})
        .then(result => {
          res.json(result.ops[0]);
        })
        .catch(err => {
          res.status(500).send(err);
        });
      })

      .delete(function(req, res){
        //if successful response will be 'complete delete successful'
        collection.deleteMany()
        .then(result => {
          if (result.deletedCount > 0) {
            return res.type('txt').send('complete delete successful');
          } else {
            return res.type('txt').send('no books deleted');
          }
        })
        .catch(err => {
          res.status(500).send(err);
        });
      });



    app.route('/api/books/:id')
      .get(function (req, res){
        var bookid = req.params.id;
        //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      
        bookid = (hex.test(bookid)) ? new ObjectId(bookid) : bookid;
      
        collection.findOne({ _id: bookid })
          .then(result => { 
          if (result) {
              return res.json(result);
            } else {
              return res.type('txt').send('no book exists');
            }
          })
          .catch(err => { res.status(500).send(err); })
      })

      .post(function(req, res){
        var bookid = req.params.id;
        var comment = req.body.comment;
        //json res format same as .get
      
        bookid = (hex.test(bookid)) ? new ObjectId(bookid) : bookid;
      
        collection.findOneAndUpdate({ _id: bookid }, { $push: { comments: comment }, $inc: { commentcount: 1 }}, { returnOriginal: false })
          .then(result => {
            if (result.value) {
              return res.json(result.value);
            } else {
              return res.type('txt').send('invalid book id');
            }
          })
          .catch(err => {
            res.status(500).send(err);
          })
      })

      .delete(function(req, res){
        var bookid = req.params.id;
        //if successful response will be 'delete successful'
      
        bookid = (hex.test(bookid)) ? new ObjectId(bookid) : bookid;
      
        collection.deleteOne({ _id: bookid })
        .then(result => {
            if (result.deletedCount === 1) {
              return res.type('txt').send('delete successful');
            } else {
              return res.type('txt').send('could not delete ' + bookid);
            }
        })
        .catch(err => {
          res.status(500).send(err);
        })
        
      });
    
    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
  });
};
