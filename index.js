// express lets us manage routes (example.com/thisRoute)
const express = require('express');
// bodyParser lets us parse the headers and body of web requests
const bodyParser = require('body-parser');
const app = express();
// fs is file storage, allows us to open files
var fs = require('fs');
var config = require('./config');
var cors = require('cors');
const { Recoverable } = require('repl');
const { json } = require('body-parser');
// We use this pretty much just for getting POST data
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;
const stripe = require('stripe')(config.stripePrivate);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./files/payments.db');

// for debugging gives us a page of forms that will help us through the process of making a stripe payment
app.get('/payment/', (req, res) => {
    var html='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Portal</title></head><body><h3>Make Customer</h3><form method="POST" action="/payment/cust">Name: <input type="text" name="name" id=""><br>Email: <input type="text" name="email" id=""><br>Payment ID: <input type="text" name="pID" id=""><br>Family Key: <input type="text" name="fKey" id=""><br><input type="submit" value="Make Customer"></form><br><br><br><h3>Make Payment</h3><form method="POST" action="/payment/pay">Item Name: <input type="text" name="itemName" id=""><br> Description: <input type="text" name="description" id=""><br>Image URL: <input type="text" name="image" id=""><br>Currency: <select name="currency" id="currency"><option value="USD">USD</option><option value="AED">AED</option><option value="ALL">ALL</option><option value="AMD">AMD</option><option value="ANG">ANG</option><option value="AUD">AUD</option><option value="AWG">AWG</option><option value="AZN">AZN</option><option value="BAM">BAM</option><option value="BBD">BBD</option><option value="BDT">BDT</option><option value="BGN">BGN</option><option value="BIF">BIF</option><option value="BMD">BMD</option><option value="BND">BND</option><option value="BSD">BSD</option><option value="BWP">BWP</option><option value="BZD">BZD</option><option value="CAD">CAD</option><option value="CDF">CDF</option><option value="CHF">CHF</option><option value="CNY">CNY</option><option value="DKK">DKK</option><option value="DOP">DOP</option><option value="DZD">DZD</option><option value="EGP">EGP</option><option value="ETB">ETB</option><option value="EUR">EUR</option><option value="FJD">FJD</option><option value="GBP">GBP</option><option value="GEL">GEL</option><option value="GIP">GIP</option><option value="GMD">GMD</option><option value="GYD">GYD</option><option value="HKD">HKD</option><option value="HRK">HRK</option><option value="HTG">HTG</option><option value="IDR">IDR</option><option value="ILS">ILS</option><option value="ISK">ISK</option><option value="JMD">JMD</option><option value="JPY">JPY</option><option value="KES">KES</option><option value="KGS">KGS</option><option value="KHR">KHR</option><option value="KMF">KMF</option><option value="KRW">KRW</option><option value="KYD">KYD</option><option value="KZT">KZT</option><option value="LBP">LBP</option><option value="LKR">LKR</option><option value="LRD">LRD</option><option value="LSL">LSL</option><option value="MAD">MAD</option><option value="MDL">MDL</option><option value="MGA">MGA</option><option value="MKD">MKD</option><option value="MMK">MMK</option><option value="MNT">MNT</option><option value="MOP">MOP</option><option value="MRO">MRO</option><option value="MVR">MVR</option><option value="MWK">MWK</option><option value="MXN">MXN</option><option value="MYR">MYR</option><option value="MZN">MZN</option><option value="NAD">NAD</option><option value="NGN">NGN</option><option value="NOK">NOK</option><option value="NPR">NPR</option><option value="NZD">NZD</option><option value="PGK">PGK</option><option value="PHP">PHP</option><option value="PKR">PKR</option><option value="PLN">PLN</option><option value="QAR">QAR</option><option value="RON">RON</option><option value="RSD">RSD</option><option value="RUB">RUB</option><option value="RWF">RWF</option><option value="SAR">SAR</option><option value="SBD">SBD</option><option value="SCR">SCR</option><option value="SEK">SEK</option><option value="SGD">SGD</option><option value="SLL">SLL</option><option value="SOS">SOS</option><option value="SZL">SZL</option><option value="THB">THB</option><option value="TJS">TJS</option><option value="TOP">TOP</option><option value="TRY">TRY</option><option value="TTD">TTD</option><option value="TWD">TWD</option><option value="TZS">TZS</option><option value="UAH">UAH</option><option value="UGX">UGX</option><option value="UZS">UZS</option><option value="VND">VND</option><option value="VUV">VUV</option><option value="WST">WST</option><option value="XAF">XAF</option><option value="XCD">XCD</option><option value="YER">YER</option><option value="ZAR">ZAR</option><option value="ZMW">ZMW</option></select><br>Customer: <input type="text" name="customer" id=""><br>Payment ID: <input type="text" name="pID" id=""><br>Family Key: <input type="text" name="fKey" id=""><br>Payment Amount: <input type="number" name="amount" id=""><br><input type="submit" value="Make Payment"></form><br><br><br><h3>Make Payment</h3><form method="POST" action="/payment/check/">Payment ID: <input type="text" name="pID" id=""><br><input type="submit" value="Check Payment is Successful"></form></body></html>';
    res.send(html);
});

// when the payment was successful
// Vanity ONLY, should not be used to record data
app.get('/payment/success', (req, res) => {
    res.send("success");
});

// when the payment was cancelled or failed
// Vanity ONLY, should not be used to record data
app.get('/payment/cancel', (req, res) => {
    res.send("cancelled");
});

// Creating a customer
app.post('/payment/cust', (req, res) => {

    // we get the fields sent to us in POST
    // this is similar to $_POST['email] from PHP
    var cName = req.body['name'];
    var cEmail = req.body['email'];
    var cpaymentID = req.body['pID'];
    var fKey = req.body['fKey'];

    // we use a stripe promise to create a customer with the data we've requested
    // we don't bother checking if the customer exists first, we just create a new one
    // we add the unique key from your application.  here it is fkey, it could be userID or whatever other identifier you use to internally track users
    stripe.customers.create({
        name: cName,
        email: cEmail,
        metadata: {'fKey': fKey}
    })
    // *then* is a return of a promise.
    .then(customer => {
        // we send back the data to the requesting browser
        res.send(customer);
    })
    .catch(error => {
        res.send(error);
    });
});
// Creating and taking a payment
app.post('/payment/pay', (req, res) =>{
    // we want to wait for things to finish without returning the function so we use an async function
    (async () => {
        // if there was no data sent at all
        if (req.body[0] == "") {
            res.send("Invalid Params" + req.params[0])
            return
        }

        // we don't do any validation to check these are empty or not, we should.. but we don't
        // customer is the object we passed back in /payment/cust
        // description is for stripe's description
        // image is the image to display in the stripe checkout window
        // currency is which currency to use, these are supported: https://stripe.com/docs/currencies
        // customPID is the internal payment ID that your application should generate (but is optional, see a bit below)
        // fkey is your internal user ID or whatever else you use to internally track your users
        // amount is the amount to charge
        var customer = JSON.parse(req.body['customer']);
        var lineName = req.body['itemName'];
        var description = req.body['description'];
        var image = req.body['image'];
        var currency = req.body['currency'];
        var customPID = req.body['pID'];
        var fKey = req.body['fKey'];
        var amount = req.body['amount'];

        // the Session Object is explained well here: https://stripe.com/docs/api/checkout/sessions/object
        // to see parameters you can set in this, see here: https://stripe.com/docs/api/checkout/sessions/create
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                name: lineName,
                description: description,
                images: [image],
                amount: amount * 100,
                currency: currency,
                quantity: 1,
            }],
            payment_intent_data:{
                // metadata is used so we can easily identify transactions
                // but is optional, you can remove the metadata key from payment_intent_data if you don't want to track them
                metadata: {
                    'pID': `${customPID}`,
                    'fKey': `${fKey}`
                },
            },
            success_url: config.successURL,
            cancel_url: config.cancelURL,
            submit_type: "pay", // for ease, options are: auto, pay, book, donate
            customer: customer.customerid // this links with the customer we created in the /payment/cust
        });
        
        // we then add our payment information to an internal database
        // session.id is the id of the session we literally just made
        // session.payment_intent is the id of the payment.  payment_intent can effectively be known as "when the user is going through the flow of paying"
        // "man started" means "manually started", and is ONLY SO THERE IS SOMETHING IN THE FIELD, DO NOT USE THIS VALUE FOR TRACKING YET
        DBAddPayment(fKey, customPID, session.id, session.payment_intent, "man started");

        // this html just redirects the user to the stripe checkout session
        var html = `<html><head><script src="https://js.stripe.com/v3/"></script><script>var stripe = Stripe("${config.stripePublic}"); stripe.redirectToCheckout({  sessionId: "{{CHECKOUT_SESSION_ID}}"}).then(function (result) {});</script></head><body></body></html>`
        res.send(html.replace("{{CHECKOUT_SESSION_ID}}", session.id));
    })();
});

// this is our webhook.  it allows stripe to call back to us with updated payment information
// this should be set in the stripe webhook page in developer settings: https://dashboard.stripe.com/webhooks
// don't forget to update the config file with your endpoint secret
app.post('/payment/hook', bodyParser.raw({type: 'application/json'}), function(request, response) {
    const sig = request.headers['stripe-signature'];
    const body = request.body;
  
    let event = null;
  
    // this try catch will try and verify that the request actually came from stripe
    // if it is successful it will just continue
    // if it fails it will log the error to console and end the request
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, config.endpointSecret);
    } catch (err) {
      // invalid signature
      console.log(err);
      response.status(400).end();
      return;
    }
  
    // these are the payment_intent statuses.  this explains where the user is in the payment process.
    // we switch through them because there are about 20 different results and we only want a few
    // in each of the cases below we update our payment in the database so we always know what state the process is in
    let intent = null;
    switch (event['type']) {
      case 'payment_intent.succeeded':
        intent = event.data.object;
        DBUpdatePayment(event['type'], intent.id);
        break;
      case 'payment_intent.payment_failed':
        intent = event.data.object;
        const message = intent.last_payment_error && intent.last_payment_error.message;
        DBUpdatePayment(event['type'], intent.id);
        break;
      case 'payment_intent.created':
        intent = event.data.object;
        DBUpdatePayment(event['type'], intent.id);
        break;
    }
  
    // we respond with ok
    response.sendStatus(200);
});

// this is where your application can check for the status of the payment
// we do it this way because we don't nessecarily know where we need to be polling to update the requesting application so we let your application grab the data instead
// you could do this by listening for an updated return in your application or by having javascript poll this every 3 seconds or so to check for a completed payment, up to you
app.post('/payment/check/', (req, res) =>{
    // if there is no payment id sent with the request we kindly tell the browser where to go
    if(req.body.pID == undefined)
        return res.sendStatus(500);

    // here we select the payment from the database
    let pID = req.body.pID;
    let sql = `SELECT pID, paymentStatus FROM payments WHERE pID = ?`;

    db.get(sql, [pID], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        // if the payment did not exist, then row will be undefined
        // and then we return a 500
        if(row == undefined)
            return res.sendStatus(500);

        var paymentRow = row;
        // if you only want to send certain information you can construct your own JSON string and parse it.
        // var jsonpID = '{"pID":"'+paymentRow.pID+'"}';
        // var jsondpID = JSON.parse(jsonpID);

        // we then return the JSON containing our payment information
        res.send(paymentRow);
    });
});

// adding the payment details to the database
function DBAddPayment(fKey, pID, seshID, paymentIntentID, status)
{
    // add a payment to the database
    db.run(`INSERT INTO payments (fKey, pID, sessionID, paymentIntentID, paymentStatus, paymentStatus) VALUES(?,?,?,?,?,?)`, [fKey, pID, seshID, paymentIntentID, status], function(err) {
        if (err) {
            return console.log(err.message);
        }
    });
}

// updating the payment details with the paymentStatus
function DBUpdatePayment(paymentStatus, intentID)
{
    
    // update payment status to current intent's status
    let data = [paymentStatus, intentID];
    let sql = `UPDATE payments
                SET paymentStatus = ?
                WHERE paymentIntentID = ?`;

    db.run(sql, data, function(err) {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Updated: ${this.changes}`);

    });
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});