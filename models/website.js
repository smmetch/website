const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    user_id: String,
    first_name: String,
    last_name: String,
    rating: [Boolean],
    content: String,
    likes_count: Number,
    comment_count: Number
});

const UserSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    password: String,
    Gender: String
});

const CommentSchema = new mongoose.Schema({
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review', // Reference the Review model to create a relationship
        required: true,
      },
    name: String,
    date: Date,
    comment: String
});

const Review = mongoose.model('Review', ReviewSchema)
const Comment = mongoose.model('Comment', CommentSchema)
const User = mongoose.model('User', UserSchema)

module.exports = {
    Review,
    Comment,
    User
  };