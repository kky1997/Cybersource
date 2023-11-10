# Introduction
This application was created as part of the Attack Flow project, which aims to bridge the gap between cyber security professionals and attackers by creating a convenient and robust tool for reporting attacks, generating data and diagrams, and storing these reports, data, and diagrams. This application uses some elements from the MITRE Attack Flow project.

# Contributors
Kai Koo
Edward Sellars
Blake Hammond

# Setup Details
This webapp runs using Node.js. Ensure you have Node.js installed.

We are also using a Docker dev container to handle all dependencies. Docker is not required by highly advised

To launch the app (without docker), run the following commands:

1. npm install (Installs the required node packages)

2. service mysql start (Starts the database)

3. mysql < database/cybersource.sql (Loads the database with data)

2. npm start (Starts the application on local host)

# Tech Stack
This webapp uses HTML, CSS and Vue.js for the frontend. For the backend it uses Node.js with express handling the routing. The database management system is MySQL.

This is a single page application.

# Coding Standards
This webapp was implemented whilst using ESLint to ensure coding standards were maintained.

Printing to console is to be kept to a minimum and at this point Server logging is not required.

# File Structure
The public folder contains the client side files. This includes the index.html file, associated scripts (./javascripts), styling (./stylesheets), documents uploaded to the system (./uploads), pictures for the webapp logo and other miscellaneous things (./images) and files required for the diagram builder (./umd).

The database folder contains a backup of some test data that can be loaded.

The routes folder contains our server side code that handles requests. The index.js file is used for login procedures and anything that does not require authentication to do. The user.js file requires a user to be logged in and have certain roles before they can call the code in here. This prevents users from doing anything they should not be able to.

app.js is where the middleware is and this essentially ties all our server side code together.

# Cybersource User Guide
This word document gives an overview of what users can do in the system and how they do it.