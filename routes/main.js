var express = require('express');
var router = express.Router();
var conn = require('../database');
var getAge = require('get-age');
var nodemailer = require('nodemailer');
var rand = Math.floor((Math.random() * 10000) + 54);

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'smartvote9@gmail.com',
        pass: 'ysdmnrybhhswbhca'
    }
});

var account_address;
var data;

router.get('/form', function(req, res, next) {
    if(req.session.loggedinUser) {
        res.render('voter-registration.ejs');
    } else {
        res.redirect('/login');
    }
});

router.post('/registerdata', function(req, res) {
    debugger
    data = req.body.smartvoteno;
    account_address = req.body.account_address;

    let sql = "SELECT * FROM smartvote_info WHERE smartvoteno = ?";
    conn.query(sql, [data], (error, results) => {
        if (error) {
            console.error('Error executing query:', error.message);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            var dob = results[0].dob;
            console.log('Date of Birth:', dob); // Log the retrieved date of birth
            var email = results[0].email;
            var age = getAge(dob);
            console.log('Age:', age); // Log the calculated age
            var is_registered = results[0].is_registered;

            if (is_registered !== 'YES') {
                if (age >= 18) {
                    var mailOptions = {
                        from: 'admiredh@gmail.com',
                        to: email,
                        subject: "Please confirm your Email account",
                        text: "Hello, Your otp is " + rand
                    };

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.error('Error sending email:', error);
                            return res.status(500).send('Error sending email: ' + error.message);
                        } else {
                            console.log('Email sent: ' + info.response);
                            res.render('emailverify.ejs');
                        }
                    });
                    
                } else {
                    console.log('Age is less than 18:', age);
                    res.send('You cannot vote as your age is less than 18');
                }
            } else {
                res.render('voter-registration.ejs', { alertMsg: "You are already registered. You cannot register again" });
            }
        } else {
            res.send('smartvote number not found.');
        }
    });
});

router.post('/otpverify', (req, res) => {
    var otp = req.body.otp;
    if (otp == rand) {
        var record = { Account_address: account_address, Is_registered: 'Yes' };
        var sql = "INSERT INTO registered_users SET ?";
        conn.query(sql, record, function(err, res2) {
            if (err) {
                console.error('Error inserting record:', err.message);
                return res.status(500).send('Internal Server Error');
            } else {
                var sql1 = "UPDATE smartvote_info SET is_registered = ? WHERE smartvoteno = ?";
                var record1 = ['YES', data];
                conn.query(sql1, record1, function(err1, res1) {
                    if (err1) {
                        console.error('Error updating record:', err1.message);
                        return res.status(500).send('Internal Server Error');
                    } else {
                        console.log("1 record updated");
                        var msg = "You are successfully registered";
                        res.render('voter-registration.ejs', { alertMsg: msg });
                    }
                });
            }
        });
    } else {
        res.render('voter-registration.ejs', { alertMsg: "Session Expired! You have entered wrong OTP" });
    }
});

module.exports = router;