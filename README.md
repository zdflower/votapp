# Voting App - FCC Dynamic Web Project

## User stories

- [x] As an authenticated user, I can keep my polls and come back later to access them.
- [x] As an authenticated user, I can share my polls with my friends.
- [x] As an authenticated user, I can see the aggregate results of my polls.
- [x] As an authenticated user, I can delete polls that I decide I don't want anymore.
- [x] As an authenticated user, I can create a poll with any number of possible items.
- [x] As an unauthenticated or authenticated user, I can see and vote on everyone's polls.
- [x] As an unauthenticated or authenticated user, I can see the results of polls in chart form. (This could be implemented using Chart.js or Google Charts.)
- [ ] As an authenticated user, if I don't like the options on a poll, I can create a new option.

## Other things to do:

- [ ] Github authentication
- [ ] mLab online database
- [ ] Add form validation.
- [ ] Use cdn links for bootstrap, jquery, chart.js, fontawesome.
- [ ] Ask twice before deleting a poll (instead of deleting it inmediately after clicking the button).

## Comments

I am learning a lot from the task itself and the bugs I make (mostly the process of finding and repair).

There are many sources that helped me learn, understand various aspects of the project and solving problems:

* Clementine.js http://www.clementinejs.com/
* Node & Express from Scratch https://github.com/bradtraversy/nodekb
* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website
* Handling Errors & Improving the Project Setup - Creating a REST API with Node.js https://www.youtube.com/watch?v=UVAMha41dwo
* Passport.js docs http://www.passportjs.org/docs/
* Chart.js http://www.chartjs.org/docs/latest/getting-started/usage.html
* FCC Building a REST API https://www.youtube.com/channel/UC8butISFwT-Wl7EV0hUK0BQ
* Bootstrap docs, for example: https://getbootstrap.com/docs/3.3/examples/sticky-footer/
* Pug https://pugjs.org/api/getting-started.html
* Mongoose http://mongoosejs.com/docs/ and MongoDB manual https://docs.mongodb.com/manual/
* FCC Forum https://forum.freecodecamp.org
* Stackoverflow, por ejemplo
  * https://stackoverflow.com/questions/1321878/how-to-prevent-favicon-ico-requests
  * https://stackoverflow.com/questions/32811510/mongoose-findoneandupdate-doesnt-return-updated-document#32811548
  * etc.
* https://www.tutorialspoint.com/expressjs/
* https://www.w3schools.com/jquery/jquery_ref_ajax.asp
* https://caolan.github.io/async/docs.html
* https://github.com/bocoup/jqfundamentals.com
* Eloquent Javascript http://eloquentjavascript.net
* Joi package for validation.
* etc.

## Other Comments

* For the moment anyone can vote any number of times.
* You can share a poll by copying the link of that poll's page.
* I would like to improve the design of the pages.
* The polls have date of creation (for now, in english).
* The index page shows polls by date of creation (the last first).
