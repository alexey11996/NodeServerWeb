var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    exphbs = require('express-handlebars'),
    expressValidator = require('express-validator'),
    flash = require('connect-flash'),
    Handlebars = require('handlebars'),
    session = require('express-session'),
    cons = require('consolidate'),
    app = express();

const { Pool } = require('pg');

var connectionString = "postgres://postgres:123@localhost:1111/fluffypet1";

Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if(a == b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));

app.use(flash());

// Global Vars
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.username || null;
    next();
});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/register', function(req, res){
    res.render('register');
});

app.post('/register', function(req, res){
    var name = req.body.name;
    var email = req.body.email;
    var phone_number = req.body.phone;
    var password = req.body.password;
    var password2 = req.body.password2;

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('phone', 'Phone Number is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors){
        res.render('register',{
            errors:errors
        });
    }
    else{
        const pool = new Pool({
            connectionString: connectionString,
        })
        pool.query('INSERT INTO public."User" (u_id, u_fio, u_email, u_pass, u_phone) VALUES ((SELECT MAX(u_id + 1) FROM public."User"), $1, $2, $3, $4)', 
            [name, email, password, phone_number],  (error, response) => {
            //pool.end();
            })
        
        var price = '0';
        var status = 'In Progress';
        var adress = 'Default';
        var paytype = 'Cache';
        pool.query('INSERT INTO public."Order" (o_id, u_id, o_price, o_status, o_adress, o_paytype) VALUES ((SELECT MAX(o_id+1) FROM public."Order"), (SELECT MAX(o_id+1) FROM public."Order"), $1, $2, $3, $4)',
        [price, status, adress, paytype], (error, response) => {
            pool.end();
        });
        req.flash('success_msg', 'You are registered and can now login');
        res.redirect('/login');
    }  
});

app.post('/login', function(req, res) {
    var name = req.body.user_name;
    var password = req.body.password;


    req.checkBody('user_name', 'Name is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    var errors = req.validationErrors();

    if (errors){
        res.render('login',{
            errors:errors
        });
    }
    else{
        var count = 0;
        const pool = new Pool({
            connectionString: connectionString,
        });
        pool.query('SELECT count(*) FROM public."User" WHERE u_fio LIKE $1 AND u_pass LIKE $2',
            [name, password], (error, response) => {
                var mystring = JSON.stringify(response.rows[0]);
                var objectValue = JSON.parse(mystring);
                count = objectValue['count'];
                if (count == 1){
                    req.session.authorized = true;
                    req.session.username = name;
                    res.redirect('/');
                    count = 0;
                }
                else {
                    req.flash('error_msg', 'Wrong login or password!');
                    res.redirect('/login');                   
                    count = 0;
                }
                pool.end();
            });
    }
  });

app.get('/', function (req, res) {
    const pool = new Pool({
        connectionString: connectionString,
    })
    pool.query('SELECT * FROM public.animal', (error, response) => {
        res.render('index', {animal : response.rows});
        pool.end();
    })
});

app.get('/profile', function(req, res){
    var username = res.locals.user;
    const pool = new Pool({
        connectionString: connectionString,
    })
    pool.query('SELECT * FROM public.profile WHERE u_fio LIKE $1', [username], (error, response) => {
        res.render('profile', {profile : response.rows});
        pool.end();
    })
});

app.get('/shoppingCart', function(req, res){
    var username = res.locals.user;
    const pool = new Pool({
        connectionString: connectionString,
    })
    pool.query('SELECT * FROM public.animal WHERE a_name in (SELECT ord_item_name FROM public."order_item" WHERE o_id = (SELECT o_id FROM public."Order" WHERE u_id = (SELECT u_id FROM public."User" WHERE u_fio LIKE $1)))',
        [username], (error, response) => {
        res.render('shoppingCart', {animal : response.rows});
        pool.end();
    })
});

app.get('/particularPat', function(req, res){
    var id = req.query.id;
    const pool = new Pool({
        connectionString: connectionString,
    })
    pool.query('SELECT * FROM public.animal WHERE a_id=$1',
        [id], (error, response) => {
        res.render('particularPat', {animal : response.rows});
        pool.end();
    })
});


app.post('/add', function(req, res){
    const pool = new Pool({
        connectionString: connectionString,
    })
    var category = req.body.category;
    var name = req.body.name;
    var photo = req.body.photo;
    var description = req.body.description;
    var price = req.body.price;
    pool.query('INSERT INTO public.animal (a_id, categ_id, a_name, a_photo, a_descr, a_price) VALUES ((SELECT MAX(a_id+1) FROM public.animal), $1, $2, $3, $4, $5)',
        [category, name, photo, description, price], (error, response) => {
        res.redirect('/');
        pool.end();
    })
});

app.delete('/delete/:id', function(req, res){
    const pool = new Pool({
        connectionString: connectionString,
    })
    var id = req.params.id;
    pool.query('DELETE FROM public.animal WHERE a_id = $1', [req.params.id], (error, response) => {
        res.sendStatus(200);
        pool.end();
    });
});

app.post('/addToOrder/:id/:petname', function(req, res){
    const pool = new Pool({
        connectionString: connectionString,
    })
    var username = res.locals.user; // login user's
    var id = req.params.id; // animal's id (product)
    var petname = req.params.petname;

        pool.query('INSERT INTO public."order_item" (ord_item_id, o_id, ord_item_name) VALUES ((SELECT MAX((ord_item_id::int)+1) FROM public."order_item"), (SELECT o_id FROM public."Order" WHERE u_id = (SELECT u_id FROM public."User" WHERE u_fio LIKE $1)), $2)',
        [username, petname], (error, response) => {
            res.sendStatus(200);
            pool.end();
        });    
});

app.delete('/deleteFromOrder/:petname', function(req, res){
    const pool = new Pool({
        connectionString: connectionString,
    })
    var username = res.locals.user;
    var petname = req.params.petname;
    pool.query('DELETE FROM public."order_item" WHERE o_id = (SELECT o_id FROM public."Order" WHERE u_id = (SELECT u_id FROM public."User" WHERE u_fio LIKE $1)) AND ord_item_name LIKE $2', 
        [username, petname], (error, response) => {
        res.sendStatus(200);
        pool.end();
    });
});

app.post('/edit', function(req, res){
    const pool = new Pool({
        connectionString: connectionString,
    })
    var id = req.body.id;
    var name = req.body.name;
    var photo = req.body.photo;
    var description = req.body.description;
    var price = req.body.price;
    pool.query('UPDATE public.animal SET a_name=$1, a_photo=$2, a_descr=$3, a_price=$4 WHERE a_id=$5',
    [name, photo, description, price, id], (error, response) => {
        res.redirect('/');
        pool.end();
    });
});

app.get('/logout', function(req, res){

    delete req.session.authorized;
    delete req.session.username;
    req.flash('success_msg', 'You are logged out');

    res.redirect('/login');
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server listening on port %d in %s mode", this.address().port, app.settings.env);
});

