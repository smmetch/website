document.addEventListener('DOMContentLoaded', () => {
  const editButtons = document.querySelectorAll('.edit-button');

  editButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const reviewId = button.dataset.reviewId;
      const reviewBox = document.querySelector(`#testimonial-box${reviewId}`);

      // Find the existing review content (the <p> element)
      const existingContentElement = reviewBox.querySelector('#editpost');

      // Create a container for the textarea and save button
      const container = document.createElement('div');

      // Create a textarea element with the existing review content
      const textareaElement = document.createElement('textarea');
      textareaElement.classList.add('edit-textarea');
      textareaElement.value = existingContentElement.textContent; // Use value to set the content

      // Append the textarea to the container
      container.appendChild(textareaElement);

      // Add a "Save" button to submit the edited review
      const saveButton = document.createElement('button');
      saveButton.classList.add('save-button');
      saveButton.textContent = 'Save';

      // Attach event listener to the "Save" button
      saveButton.addEventListener('click', async () => {
        const editedContent = textareaElement.value;

        try {
          // Send the edited review data to the server using fetch
          const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'PATCH', // Use the PATCH HTTP method for updating data
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: editedContent }),
          });

          if (response.ok) {
            // If the review is successfully updated, reload the page to see the changes
            window.location.reload();
          } else {
            console.error('Failed to update review.');
            alert('Failed to update review. Please try again.');
          }
        } catch (error) {
          console.error('Error updating review:', error);
          alert('Error updating review. Please try again.');
        }
      });

      // Append the save button to the container
      container.appendChild(saveButton);

      // Replace the existing review content (the <p> element) with the container
      const clientComment = reviewBox.querySelector('.client-comment');
      clientComment.innerHTML = ''; // Clear existing content
      clientComment.appendChild(container);
    });
  });
});


async function deleteReview(reviewId) {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        // If the review was successfully deleted, delete the associated comments
        await fetch(`/api/comments/${reviewId}`, {
          method: 'DELETE',
        });
  
        // Reload the page to see the updated reviews and comments
        location.reload();
      } else {
        console.error('Failed to delete review:', response.statusText);
        // Handle the error or display an error message to the user
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      // Handle the error or display an error message to the user
    }
  }