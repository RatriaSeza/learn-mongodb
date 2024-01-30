const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const { body, check, validationResult } = require('express-validator');
const methodOverride = require('method-override');

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

app.use(methodOverride('_method')); //method override

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
 * Create contact route.
 * Renders the create contact page.
 */
app.get('/contact/create', (req,res) => {
	res.render('contact/create', {title: 'Contact | Create Data', layout: 'layouts/app'});
})

/**
 * Add contact route.
 * Handles the form submission to add a new contact.
 */
app.post('/contact', 	
	body('email').custom(async (value) => {
		const isDuplicate = await Contact.findOne({email: value}); 
		if (isDuplicate) {
			throw new Error('Email already registered');
		}
		return true;
	}),
	check('email', 'Invalid email format').isEmail(),
	check('name', 'Invalid name, min 3 characters').isLength({min: 3}),
	check('phone', 'Invalid phone number, min 11 characters').isLength({min: 11}),
	check('phone', 'Invalid phone number').isMobilePhone(),
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.render('contact/create', {title: 'Contact | Create Data', layout: 'layouts/app', errors: errors.array()});
		} else {
			Contact.insertMany(req.body).then(() => {
				req.flash('msg', 'Data contact successfully added');
				res.redirect('/contact');
			})
		}
	}
);

/**
 * Add delete route.
 * Handles the form submission to delete a contact.
 */
// app.get('/contact/:id/delete', async (req, res) => {
// 	const contact = await Contact.findOne({_id: req.params.id});
// 	if (!contact) {
// 		res.status(404).send('404 Not Found');
// 	} else {
// 		Contact.deleteOne({_id: contact.id}).then(() => {
// 			req.flash('msg', 'Data contact successfully deleted');
// 			res.redirect('/contact');
// 		});
// 	}
// })
app.delete('/contact', (req, res) => {
	Contact.deleteOne({_id: req.body.id}).then(() => {
		req.flash('msg', 'Data contact successfully deleted');
		res.redirect('/contact');
	});
});

/**
 * Edit contact route.
 * Renders the Edit contact page.
 */
app.get('/contact/:id/edit', (req,res) => {
	Contact.findById(req.params.id).then((contact) => {
		res.render('contact/edit', {title: 'Contact | Edit Data', layout: 'layouts/app', contact});
	});
})

/**
 * Update contact route.
 * Handles the form submission to update a new contact.
 */
app.put('/contact',
	body('email').custom(async (value, { req }) => {
		const isDuplicate = await Contact.findOne({email: value}); 
		if (isDuplicate && value !== req.body.oldEmail) {
			throw new Error('Email already registered');
		}
		return true;
	}),
	check('email', 'Invalid email format').isEmail(),
	check('name', 'Invalid name, min 3 characters').isLength({min: 3}),
	check('phone', 'Invalid phone number, min 11 characters').isLength({min: 11}),
	check('phone', 'Invalid phone number').isMobilePhone(),
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.render('contact/edit', {title: 'Contact | Edit Data', layout: 'layouts/app', errors: errors.array(), contact: req.body});
		} else {
			Contact.updateOne({_id: req.body._id}, {
				$set: {
					name: req.body.name,
					email: req.body.email,
					phone: req.body.phone
				}
			}).then(() => {
				req.flash('msg', 'Data contact successfully updated');
				res.redirect('/contact');
			})
		}
	}
)

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

/**
 * 404 route.
 * Handles all other routes that are not defined.
 */
app.use('/', (req, res) => {
	res.status(404).send('Page not found');
})
