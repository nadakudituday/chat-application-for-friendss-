// Get the forms
const signUpForm = document.getElementById('signup');
const signInForm = document.getElementById('signIn');

// Handle sign up form submission
signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    const formData = {
        fName: document.getElementById('fName').value,
        lName: document.getElementById('lName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
    };

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        // Handle the response (e.g., show success message)
        alert(data.message); // Show the response message from the server

        // Optionally redirect to sign in after signup
        // window.location.href = '/'; // Redirect to the main page or signin page

    } catch (error) {
        console.error('Error:', error);
    }
});

// Handle sign in form submission
signInForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
    };

    try {
        const response = await fetch('/api/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        // Handle the response (e.g., show success message)
        alert(data.message); // Show the response message from the server

        // Optionally redirect to a welcome page after sign in
        // window.location.href = '/welcome'; // Redirect to a welcome page

    } catch (error) {
        console.error('Error:', error);
    }
});
  