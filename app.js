const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

require('./utils/db'); // connect to database
const Contact = require('./app/model/contact'); // import Contact model

const app = express();

app.listen(3000, () => console.log('Listening on port 3000!'));

app.set('view engine', 'ejs');
app.use(expressLayouts); // third-party middleware
app.use(express.static('public')); // built-in middleware
app.use(express.urlencoded({extended: true})); // built-in middleware

app.use(cookieParser('secret'));
app.use(session({
	cookie: {maxAge: 6000},
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(flash());

/**
 * Home route.
 * Renders the index page with student data.
 */
app.get('/', (req, res) => {
	const students = [{
		name: 'Satria',
		email: 'satria@example.com'
	}, {
		name: 'Aji',
		email: 'aji@example.com'
	}, {
		name: 'Rama',
		email: 'rama@example.com'
	}]
	res.render('index', {name: 'Satria', title: 'Home', students, layout: 'layouts/app'});
})

/**
 * About route.
 * Renders the about page.
 */
app.get('/about', (req, res) => {
	res.render('about', {title: 'About', layout: 'layouts/app'});
})

/**
 * Contact route.
 * Renders the contact page with contact data.
 */
app.get('/contact', (req, res) => {
	Contact.find().then(contacts => {
		res.render('contact/index', {
			title: 'Contact', 
			layout: 'layouts/app', 
			contacts, 
			msg: req.flash('msg')});
	})
})

/**
 * Contact detail route.
 * Renders the detail page for a specific contact.
 */
app.get('/contact/:id', (req, res) => {
	Contact.findOne({_id: req.params.id}).then(contact => {
		res.render('detail', {
			title: `Contact's Detail`, 
			layout: 'layouts/app', 
			contact});
	})
})