const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var config = require('./config');
var cors = require('cors');
const { Recoverable } = require('repl');
// We use this pretty much just for getting POST data
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;
const stripe = require('stripe')(config.stripePrivate);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./files/payments.db');

app.get('/payment/', (req, res) => {
    var html='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Portal</title></head><body><h3>Make Customer</h3><form method="POST" action="/payment/cust">Name: <input type="text" name="name" id=""><br>Email: <input type="text" name="email" id=""><br>Payment ID: <input type="text" name="pID" id=""><br>Family Key: <input type="text" name="fKey" id=""><br><input type="submit" value="Make Customer"></form><br><br><br><h3>Make Payment</h3><form method="POST" action="/payment/pay">Description: <input type="text" name="description" id=""><br>Image URL: <input type="text" name="image" id=""><br>Currency: <select name="currency" id="currency"><option value="USD">USD</option><option value="AED">AED</option><option value="ALL">ALL</option><option value="AMD">AMD</option><option value="ANG">ANG</option><option value="AUD">AUD</option><option value="AWG">AWG</option><option value="AZN">AZN</option><option value="BAM">BAM</option><option value="BBD">BBD</option><option value="BDT">BDT</option><option value="BGN">BGN</option><option value="BIF">BIF</option><option value="BMD">BMD</option><option value="BND">BND</option><option value="BSD">BSD</option><option value="BWP">BWP</option><option value="BZD">BZD</option><option value="CAD">CAD</option><option value="CDF">CDF</option><option value="CHF">CHF</option><option value="CNY">CNY</option><option value="DKK">DKK</option><option value="DOP">DOP</option><option value="DZD">DZD</option><option value="EGP">EGP</option><option value="ETB">ETB</option><option value="EUR">EUR</option><option value="FJD">FJD</option><option value="GBP">GBP</option><option value="GEL">GEL</option><option value="GIP">GIP</option><option value="GMD">GMD</option><option value="GYD">GYD</option><option value="HKD">HKD</option><option value="HRK">HRK</option><option value="HTG">HTG</option><option value="IDR">IDR</option><option value="ILS">ILS</option><option value="ISK">ISK</option><option value="JMD">JMD</option><option value="JPY">JPY</option><option value="KES">KES</option><option value="KGS">KGS</option><option value="KHR">KHR</option><option value="KMF">KMF</option><option value="KRW">KRW</option><option value="KYD">KYD</option><option value="KZT">KZT</option><option value="LBP">LBP</option><option value="LKR">LKR</option><option value="LRD">LRD</option><option value="LSL">LSL</option><option value="MAD">MAD</option><option value="MDL">MDL</option><option value="MGA">MGA</option><option value="MKD">MKD</option><option value="MMK">MMK</option><option value="MNT">MNT</option><option value="MOP">MOP</option><option value="MRO">MRO</option><option value="MVR">MVR</option><option value="MWK">MWK</option><option value="MXN">MXN</option><option value="MYR">MYR</option><option value="MZN">MZN</option><option value="NAD">NAD</option><option value="NGN">NGN</option><option value="NOK">NOK</option><option value="NPR">NPR</option><option value="NZD">NZD</option><option value="PGK">PGK</option><option value="PHP">PHP</option><option value="PKR">PKR</option><option value="PLN">PLN</option><option value="QAR">QAR</option><option value="RON">RON</option><option value="RSD">RSD</option><option value="RUB">RUB</option><option value="RWF">RWF</option><option value="SAR">SAR</option><option value="SBD">SBD</option><option value="SCR">SCR</option><option value="SEK">SEK</option><option value="SGD">SGD</option><option value="SLL">SLL</option><option value="SOS">SOS</option><option value="SZL">SZL</option><option value="THB">THB</option><option value="TJS">TJS</option><option value="TOP">TOP</option><option value="TRY">TRY</option><option value="TTD">TTD</option><option value="TWD">TWD</option><option value="TZS">TZS</option><option value="UAH">UAH</option><option value="UGX">UGX</option><option value="UZS">UZS</option><option value="VND">VND</option><option value="VUV">VUV</option><option value="WST">WST</option><option value="XAF">XAF</option><option value="XCD">XCD</option><option value="YER">YER</option><option value="ZAR">ZAR</option><option value="ZMW">ZMW</option></select><br>Customer: <input type="text" name="customer" id=""><br>Payment ID: <input type="text" name="pID" id=""><br>Family Key: <input type="text" name="fKey" id=""><br>Payment Amount: <input type="number" name="amount" id=""><br><input type="submit" value="Make Payment"></form><br><br><br><h3>Make Payment</h3><form method="POST" action="/payment/check/">Payment ID: <input type="text" name="pID" id=""><br><input type="submit" value="Make Payment"></form></body></html>';
    res.send(html);
});

app.get('/payment/success', (req, res) => {
    res.send("success");
});
app.get('/payment/cancel', (req, res) => {
    res.sendStatus("cancelled");
});

app.post('/payment/cust', (req, res) => {
    var cName = req.body['name'];
    var cEmail = req.body['email'];
    var cpaymentID = req.body['pID'];
    var fKey = req.body['fKey'];

    stripe.customers.create({
        name: cName,
        email: cEmail,
        metadata: {'fKey': fKey}
    })
    .then(customer => {
        // make payment now
        res.send(customer);
    })
    .catch(error => {
        console.error(error);
        res.send(error);
    });
});
app.post('/payment/pay', (req, res) =>{
    (async () => {
        if (req.body[0] == "") {
            res.send("Invalid Params" + req.params[0])
            return
        }
        var customer = JSON.parse(req.body['customer']);
        var description = req.body['description'];
        var image = req.body['image'];
        var currency = req.body['currency'];
        var customPID = req.body['pID'];
        var amount = req.body['amount'];
        var fKey = req.body['fKey'];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                name: customer.name,
                description: description,
                images: [image],
                amount: amount * 100,
                currency: currency,
                quantity: 1,
            }],
            payment_intent_data:{
                metadata: {
                    'pID': `${customPID}`,
                    'fKey': `${fKey}`
                },
            },
            success_url: `${config.successURL}`,
            cancel_url: config.cancelURL,
            submit_type: "pay",
            customer: customer.customerid
        });

        DBAddPayment(fKey, customPID, session.id, session.payment_intent, "man started");

        var html = `<html><head><script src="https://js.stripe.com/v3/"></script><script>var stripe = Stripe("${config.stripePublic}"); stripe.redirectToCheckout({  sessionId: "{{CHECKOUT_SESSION_ID}}"}).then(function (result) {});</script></head><body></body></html>`
        res.send(html.replace("{{CHECKOUT_SESSION_ID}}", session.id));
    })();
});

app.post('/payment/hook', bodyParser.raw({type: 'application/json'}), function(request, response) {
    const sig = request.headers['stripe-signature'];
    const body = request.body;
  
    let event = null;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, config.endpointSecret);
    } catch (err) {
      // invalid signature
      console.log(err);
      response.status(400).end();
      return;
    }
  
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
  
    response.sendStatus(200);
});

var paymentInfo;
app.post('/payment/check/', (req, res) =>{
    if(req.body.pID == undefined)
        return res.sendStatus(500);

    //let pID = Decrypt(req.params[0], config.PaymentPrivate);
    //let pID = req.params[0];
    let pID = req.body.pID;
    let sql = `SELECT * FROM payments WHERE pID = ?`;

    db.get(sql, [pID], (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        if(row == undefined)
            return res.sendStatus(404);

        paymentRow = row;

        // if full = true, returns the object as JSON

        // if full = false, return the local payment id that equals the pID (DSM Unique)
        var jsonpID = '{"pID":"'+paymentRow.pID+'"}';
        var jsondpID = JSON.parse(jsonpID);
        res.send(jsondpID);
    });
});

function DBAddPayment(fKey, pID, seshID, paymentIntentID, status)
{
    // add a payment to the database
    db.run(`INSERT INTO payments (fKey, pID, sessionID, paymentIntentID, paymentStatus, paymentStatus) VALUES(?,?,?,?,?,?)`, [fKey, pID, seshID, paymentIntentID, status], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}


function DBUpdatePayment(paymentStatus, intentID)
{
    // update payment status to either failed or success

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

// function Encrypt(toEncrypt, relativeOrAbsolutePathToPublicKey) {
//     const absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey)
//     const publicKey = fs.readFileSync(absolutePath, 'utf8')
//     const buffer = Buffer.from(toEncrypt, 'utf8')
//     const encrypted = crypto.publicEncrypt(publicKey, buffer)
//     return encrypted.toString('base64')
// }

// function Decrypt(toDecrypt, relativeOrAbsolutePathtoPrivateKey) {
//     const absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey)
//     const privateKey = fs.readFileSync(absolutePath, 'utf8')
//     const buffer = Buffer.from(toDecrypt, 'base64')
//     const decrypted = crypto.privateDecrypt(
//     {
//     key: privateKey.toString(),
//     passphrase: '',
//     },
//     buffer,
// )
// return decrypted.toString('utf8')
// }

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});