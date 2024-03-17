
# User Registration and Log In
### using Express, Mongoose and JSON Web Tokens

[Link to Full Tutorial](https://merncraft.github.io/register-login)

Most sites today customize their content for specific users, or allow users to create their own content. This could be a shopping cart, a social network, progress through a training course, an appointments diary, or any other kind of dynamic content.

If this is your goal, then your site needs to connect to a database, and create, read, update and delete records, in response to your end-users' interactions in the browser. The very first requirement is to give your users a way to register with your site, and to log in with their registered username or email, and their password.

One standard technique is to create a backend server which acts as a gatekeeper between the web page in the end-user's browser and the database. The database will securely store your users' connection details, and give them privileged access after they log in.

In this tutorial, you will be learning how to:

* Set up an Express backend server
* Connect the server to a MongoDB database
* Create a Mongoose model for User records in the database
* Test that your model works as planned
* Allow new users to sign up
* Let new users sign in to their account
* Provide privileged data to signed-in users
