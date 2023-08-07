async function submitComment(postId, commentText) {
  try {
    // Send the comment data to the server using fetch
    const response = await fetch('/api/postcomment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_id: postId,
        name: `${commenterFirstName} ${commenterLastName}`,
        comment: commentText,
      }),
    });

    const data = await response.json();

    // If the comment is successfully posted, update the UI with the new comment
    if (response.status === 201) {
      const commentCountElement = document.querySelector(`#comments-count-${postId}`);
      if (commentCountElement) {
        const currentCommentCount = parseInt(commentCountElement.textContent, 10);
        commentCountElement.textContent = currentCommentCount + 1;
      }
      // Create the comment element dynamically
      const commentElement = document.createElement('div');
      commentElement.classList.add('reply', 'mt-4', 'text-justify', 'float-left');
      commentElement.innerHTML = `
        <h4>${data.name}</h4>
        <span>- ${data.date}</span>
        <br>
        <p>${data.comment}</p>
      `;

      // Find the container where you want to display the new comment
      const commentContainer = document.querySelector(`#testimonial-box${postId} .other-comment`);

      // Add the new comment element to the container
      commentContainer.appendChild(commentElement);
    } else {
      console.error('Failed to post comment:', data);
      alert('Failed to post comment. Please try again.');
    }
  } catch (error) {
    window.location.reload();
  }
}

// Attach event listeners to the "Post" buttons for each review
const commenterFirstName = userData.firstName;
const commenterLastName = userData.lastName;

// Attach event listeners to the "Post" buttons for each review
const postButtons = document.querySelectorAll('.post-button');

// Attach event listener to each "Post" button
postButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const reviewBox = button.closest('.testimonial-box');
    const postId = reviewBox.dataset.testimonialId;
    const commentTextbox = reviewBox.querySelector(`#comment-textbox-${postId}`);

    // Call the submitComment function with the postId and commentText
    submitComment(postId, commentTextbox.value);
  });
});

//Sort
const sortBySelect = document.getElementById('sort-by-select');
sortBySelect.addEventListener('change', () => {
  const selectedOption = sortBySelect.value;
  // Reload the page with the selected sorting option as a query parameter
  window.location.search = `sort=${selectedOption}`;
});

// FOR LEAVE A REVIEW
async function submitReview() {
  try {
    // Get the review data from the form elements
    const ratingElements = document.querySelectorAll('input[name="rating"]');
    const rating = Array.from(ratingElements).map((element) => element.checked);
    const content = document.getElementById('review-message').value.trim();

    // Check if the rating and content are filled
    if (!rating || !content) {
      alert('Please select a rating and enter a review message.');
      return;
    }

    // Send the review data and user information to the server using fetch
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: '{{session.user._id}}', // Replace with the actual user ID from the session (if available)
        first_name: userFirstName,
        last_name: userLastName,
        rating,
        content,
      }),
    });

    const data = await response.json();

    // If the review is successfully posted, refresh the page to display the new review
    if (response.status === 201) {
      window.location.reload();
    } else {
      console.error('Failed to post review:', data);
      alert('Failed to post review. Please try again.');
    }
  } catch (error) {
    console.error('Error posting review:', error);
    alert('An error occurred while posting the review. Please try again.');
  }
}

// Attach event listener to the "send" link
const sendLink = document.getElementById('send-review');
sendLink.addEventListener('click', submitReview);

// Function to handle the heart icon click event
async function handleHeartClick(reviewId) {
  try {
    const likesCountElement = document.getElementById(`likes-count-${reviewId}`);
    let currentLikes = parseInt(likesCountElement.textContent, 10); // Get the current likes count from the UI

    // Increment the current likes count by 1
    const heartIcon = document.getElementById(`heart${reviewId}`);
      const isClicked = heartIcon.classList.contains('clicked');

      if (isClicked) {
        // If the heart icon is clicked, decrement the likes count by 1
        currentLikes -= 1;
      } else {
        // If the heart icon is not clicked, increment the likes count by 1
        currentLikes += 1;
      }

    // Make a PATCH request to update the likes count for the review
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ likes_count: currentLikes }), // Send the updated likes count to the backend
    });

    if (!response.ok) {
      throw new Error('Failed to update likes count');
    }

    // Get the updated review data from the response
    const updatedReview = await response.json();

    // Update the likes count in the UI
    likesCountElement.textContent = updatedReview.likes_count;

    heartIcon.classList.toggle('clicked');
  } catch (error) {
    console.error('Error updating likes count:', error);
  }
}

// Add event listeners to all heart icons with the class "icon heart"
const heartIcons = document.querySelectorAll('.icon.heart');
heartIcons.forEach((heartIcon) => {
  heartIcon.addEventListener('click', (event) => {
    const reviewId = event.target.getAttribute('data-review-id');
    handleHeartClick(reviewId);
  });
});
