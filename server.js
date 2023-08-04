const express = require('express');
const app = express();
const mongoose = require('mongoose');
const expbs = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const connectToMongoDB = require('./db/conn');

const equals = function (value1, value2, options) {
  return value1.toString() === value2.toString() ? options.fn(this) : options.inverse(this);
};


// Connect to MongoDB using mongoose (you need to set up your MongoDB connection here)
// mongoose.connect('mongodb://127.0.0.1/website', { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

connectToMongoDB(mongoURI, dbName);

const { Review, Comment, User } = require('./models/website');

app.engine('handlebars', expbs({ 
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials') 
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'handlebars');

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
      secret: 'your_secret_key', // Change this to a random and secure value
      resave: false,
      saveUninitialized: true,
    })
  );

  app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
  });

// Routing
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Home',
        style: "home.css"
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Me',
        style: "about-me.css"
    });
});

app.get('/login', (req, res) => {
    const errorMessage = req.session.error;
    res.render('login', {
        title: 'Log-In',
        style: "login.css",
        error: errorMessage || false
    });
});

app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user in the database based on the provided email
      const user = await User.findOne({ email });
  
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      // If the passwords do not match, display an error message
      if (!user || !passwordMatch) {
        // Store the error message in the session
        req.session.error = true;
        return res.redirect('/login'); // Redirect to the GET route for /login
      }
  
      // If the credentials are valid, the user is authenticated
      // You can perform additional actions here, like creating a session or JWT
      req.session.user = {
        _id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        // Add other relevant user data as needed
      };
  
      res.redirect(`/profile?first_name=${user.first_name}&last_name=${user.last_name}&email=${user.email}`);
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/logout', (req, res) => {
    // Clear the session data for the user (log them out)
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during log-out:', err);
        }
        res.redirect('/login'); // Redirect to the login page after log-out
    });
});

app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'Sign-Up',
        style: "signup.css"
    });
});

app.get('/portfolio', (req, res) => {
    res.render('portfolio', {
        title: 'Portfolio',
        style: "portfolio.css"
    });
});

app.get('/reviews', async (req, res) => {
  try {
    // Fetch all reviews and comments from the database
    const allReviews = await Review.find().lean().exec();
    const allComments = await Comment.find().lean().exec();

    // Create a new array of reviews, each with its associated comments
    const reviewsWithComments = allReviews.map((review) => {
      // Logging review ID and associated comments inside the map function
      const associatedComments = allComments.filter((comment) => String(comment.post_id) === String(review._id));
      return {
        ...review,
        comments: associatedComments,
      };
    });

    const userData = {
      firstName: req.session.user ? req.session.user.first_name : '',
      lastName: req.session.user ? req.session.user.last_name : '',
      isLoggedIn: Boolean(req.session.user),
    };

    // Verify userData is correctly populated
    console.log(userData);

    const { sort } = req.query;
    if (sort) {
      switch (sort) {
        case 'rating':
          reviewsWithComments.sort((a, b) => {
            const filledStarsA = a.rating.filter((star) => star === true).length;
            const filledStarsB = b.rating.filter((star) => star === true).length;
            return filledStarsB - filledStarsA;
          });
          break;
        case 'likes':
          reviewsWithComments.sort((a, b) => b.likes_count - a.likes_count);
          break;
        case 'comments':
          reviewsWithComments.sort((a, b) => b.comments.length - a.comments.length);
          break;
        // For the default option or any other unrecognized option, use the original order
        default:
          // Do nothing, already sorted by default
          break;
      }
    }

    res.render('reviews', {
      title: 'Reviews',
      style: 'reviews.css',
      reviews: reviewsWithComments,
      first_name: req.session.user ? req.session.user.first_name : '', // User's first name
      last_name: req.session.user ? req.session.user.last_name : '', // User's last name
      userData: userData,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});


app.get('/api/reviews', async (req, res) => {
        try {
          const allReviews = await Review.find();
          res.json(allReviews);
        } catch (error) {
          res.status(500).json({ error: 'Failed to fetch reviews' });
        }
      });

//get comments
app.get('/api/comments', async (req, res) => {
  try {
    const allReviews = await Comment.find();
    res.json(allReviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/profile', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const user = req.session.user;
  const { first_name, last_name, email } = user;

  try {
    // Fetch all reviews made by the current user
    const userReviews = await Review.find({ user_id: user._id }).lean().exec();
    const allComments = await Comment.find().lean().exec();

    const reviewsWithComments = userReviews.map((review) => {
      // Logging review ID and associated comments inside the map function
      const associatedComments = allComments.filter((comment) => String(comment.post_id) === String(review._id));
      return {
        ...review,
        comments: associatedComments,
      };
    });

    res.render('profile', {
      firstName: first_name,
      lastName: last_name,
      email,
      style: "profile.css",
      reviews: reviewsWithComments, // Pass the user's reviews to the template
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Create Review
app.post('/api/reviews', async (req, res) => {
  try {
    const { user_id, first_name, last_name, rating, content } = req.body;

    // Make sure the rating array has exactly 5 elements
    if (!Array.isArray(rating) || rating.length !== 5) {
      return res.status(400).json({ error: 'Rating array must have exactly 5 elements.' });
    }

    // Create a new Review object and save it to the database
    const newReview = new Review({
      user_id,
      first_name,
      last_name,
      rating,
      content,
      likes_count: 0,
      comment_count: 0,
    });

    const savedReview = await newReview.save();

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});



app.patch('/api/reviews/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { content } = req.body;

    // Find the review in the database based on the provided reviewId
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { content }, // Update the content field with the new content
      { new: true } // Return the updated document
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review); // Respond with the updated review
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.use(express.urlencoded({ extended: true }));

app.post('/api/users', async (req, res) => {
    try {
      const { first_name, last_name, email, password, Gender } = req.body;
  
      // Check if the user already exists in the database
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      // Hash the password before saving to the database
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds
  
      const newUser = new User({
        first_name,
        last_name,
        email,
        password: hashedPassword, // Save the hashed password to the database
        Gender,
      });
  
      const savedUser = await newUser.save();
      // Set session.user after successful sign-up
    req.session.user = {
    _id: savedUser._id,
    email: savedUser.email,
    first_name: savedUser.first_name,
    last_name: savedUser.last_name,
    // Add other relevant user data as needed
  };
      console.log('User data saved to the database:', savedUser);
  
      // Redirect to the profile page after saving the user data
      res.redirect(`/profile?first_name=${savedUser.first_name}&last_name=${savedUser.last_name}&email=${savedUser.email}`);
    } catch (error) {
      console.error('Error saving user data to the database:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  //delete review
  app.delete('/api/reviews/:id', async (req, res) => {
    const data = await Review.findByIdAndDelete(req.params.id)
    res.json(data)
})

//delete comment
app.delete('/api/comments/:reviewId', async (req, res) => {
  try {
    // Delete all comments with the matching review ID
    await Comment.deleteMany({ post_id: req.params.reviewId });

    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting comments:', error);
    res.status(500).json({ error: 'Failed to delete comments' });
  }
});

// post comment
app.post('/api/postcomment', async (req, res) => {
  try {
    const { post_id, name, comment } = req.body;
    console.log('POST request received at /api/postcomment');
    console.log('Request Body:', req.body);

    // Create a new Comment object and save it to the database
    const newComment = new Comment({
      post_id,
      name,
      comment,
      date: new Date().toISOString(), // Set the current date as the comment date
    });

    const savedComment = await newComment.save();

    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// ... Your other routes ...

// Route to display user's profile and their reviews
app.get('/profile', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const user = req.session.user;
  const { first_name, last_name, email } = user;

  try {
    // Fetch all reviews made by the current user
    const userReviews = await Review.find({ user_id: user._id }).lean().exec();
    const allComments = await Comment.find().lean().exec();

    const reviewsWithComments = userReviews.map((review) => {
      // Logging review ID and associated comments inside the map function
      const associatedComments = allComments.filter((comment) => String(comment.post_id) === String(review._id));
      return {
        ...review,
        comments: associatedComments,
      };
    });

    res.render('profile', {
      firstName: first_name,
      lastName: last_name,
      email,
      style: "profile.css",
      reviews: reviewsWithComments, // Pass the user's reviews to the template
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// ... Your other routes ...

// Start the server
const port = 3000;
app.listen(port, (err) => {
    if (err) {
        console.error('Error starting the server:', err);
    } else {
        console.log(`Hello! Listening at http://localhost:${port}`);
    }
});
