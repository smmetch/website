  document.addEventListener('DOMContentLoaded', function() {
    const viewMoreButtons = document.querySelectorAll('.view-more-button');
    viewMoreButtons.forEach(button => {
      button.addEventListener('click', function() {
        const reviewIndex = this.dataset.reviewIndex;
        const comments = document.querySelectorAll(`.testimonial-box#testimonial-box${reviewIndex} .reply`);
        const firstComment = document.querySelector(`.testimonial-box#testimonial-box${reviewIndex} .reply:first-child`);
        const viewMoreText = this.textContent;

        for (let i = 1; i < comments.length; i++) {
          if (comments[i].style.display === 'none' || comments[i].style.display === '') {
            comments[i].style.display = 'block';
            this.textContent = 'View Less';
          } else {
            comments[i].style.display = 'none';
            this.textContent = 'View More';
          }
        }

        if (firstComment.style.display === 'none' || firstComment.style.display === '') {
          firstComment.style.display = 'block';
        }
      });

      // Show only the first comment initially
      const reviewIndex = button.dataset.reviewIndex;
      const comments = document.querySelectorAll(`.testimonial-box#testimonial-box${reviewIndex} .reply`);
      for (let i = 1; i < comments.length; i++) {
        comments[i].style.display = 'none';
      }

      if (comments.length <= 1) {
        button.style.display = 'none';
      }
      
    });
  });