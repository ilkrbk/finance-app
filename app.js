const express = require("express");
const hbs = require("hbs");
const Pool = require("pg").Pool;
const bodyParser = require("body-parser");
const pool = new Pool({
    user: "",
    password: "",
    host: "",
    port: "",
    database: ""
});

const app = express();
const urlencodedParser = bodyParser.urlencoded({extended: false});

app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

function CountTransactionInAllAccounts(transactions, accounts) {
    for (let i = 0; i < transactions.length; i++) {
        for (let j = 0; j < accounts.length; j++) {
            if (transactions[i].accountid == accounts[j].accountid) {
                accounts[j].moneyamount = Number(accounts[j].moneyamount) + Number(transactions[i].money);
            }
        }
        let dateResult = `${transactions[i].date.getDate()}-${transactions[i].date.getMonth() + 1}-${transactions[i].date.getFullYear()} ${transactions[i].date.getHours()}:${transactions[i].date.getMinutes()}`
        transactions[i].date = dateResult;
    }
}
 
app.get("/", function(request, response){
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query('select * from transactions order by Date desc', (errTransaction, resTransaction) => {
            if (errTransaction) throw errTransaction
            CountTransactionInAllAccounts(resTransaction.rows, resAccount.rows);
            response.render("index.hbs", {
                title: "Home",
                transactionslength: 1,
                accounts: resAccount.rows,
                Transactions: resTransaction.rows.slice(0, 5)
            });
        });
    });
}); 

app.get("/pagePrevious/:transactionLength", function(request, response){
    let length = request.params.transactionLength;
    if (length > 1) {
        pool.query('SELECT * FROM account', (errAccount, resAccount) => {
            if (errAccount) throw errAccount
            pool.query(`select * from transactions order by Date desc`, (errTransaction, resTransaction) => {
                if (errTransaction) throw errTransaction
                CountTransactionInAllAccounts(resTransaction.rows, resAccount.rows);
                response.render("index.hbs", {
                    title: "Home",
                    transactionslength: Number(length) - 1,
                    accounts: resAccount.rows,
                    Transactions: resTransaction.rows.slice((Number(length)-2)*5, (Number(length)-1)*5)
                });
            });
        });
    } else {
        response.redirect("/");
    }
});

app.get("/pageNext/:transactionLength", function(request, response){
    let length = request.params.transactionLength;
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query(`select * from transactions order by Date desc`, (errTransaction, resTransaction) => {
            if (errTransaction) throw errTransaction
            CountTransactionInAllAccounts(resTransaction.rows, resAccount.rows);
            if (resTransaction.rows.slice(length*5, (Number(length) + 1)*5).length != 0) {
                response.render("index.hbs", {
                    title: "Home",
                    transactionslength: Number(length) + 1,
                    accounts: resAccount.rows,
                    Transactions: resTransaction.rows.slice(length*5, (Number(length) + 1)*5)
                });
            } else {
                response.redirect(`/pageNext/${length - 1}`);
            }
        });
    });
});

app.get("/create_account", function(request, response){
    response.render("create_account.hbs", {
        title: "Create Account",
    });
});

app.post("/create_account", urlencodedParser, function (req, res) {       
    if(!req.body) return res.sendStatus(400);
    const name = req.body.createAccountName;
    const description = req.body.createAccountDescr;
    const money = req.body.createAccountMoney;
    pool.query(`INSERT INTO account(name, description, moneyamount) VALUES ('${name}', '${description}', ${money})`, (err, data) => {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/delete/:accountsid", function(req, res){   
    const id = req.params.accountsid;
    pool.query(`DELETE FROM targetstep WHERE targetid in (select targetid from target WHERE accountid=${id})`, function(err, data) {
        if(err) return console.log(err);
    });
    pool.query(`DELETE FROM target WHERE accountid=${id}`, function(err, data) {
        if(err) return console.log(err);
    });
    pool.query(`DELETE FROM income WHERE accountid=${id}`, function(err, data) {
        if(err) return console.log(err);
    });
    pool.query(`DELETE FROM expenditure WHERE accountid=${id}`, function(err, data) {
        if(err) return console.log(err);
    });
    pool.query(`DELETE FROM account WHERE accountid=${id}`, function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/select/:accountid", function(req, res){
    const id = req.params.accountid;
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query(`SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID where Expenditure.AccountID = ${id} union all SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID where Income.AccountID = ${id} order by Date desc;`, (errTransaction, resTransaction) => {
            if (errTransaction) throw errTransaction
            pool.query(`select * from transactions order by Date desc`, (errAllTransaction, resAllTransaction) => {
                if (errAllTransaction) throw errAllTransaction
                CountTransactionInAllAccounts(resAllTransaction.rows, resAccount.rows);
                for (let i = 0; i < resTransaction.rows.length; i++) {
                    let dateResult = `${resTransaction.rows[i].date.getDate()}-${resTransaction.rows[i].date.getMonth() + 1}-${resTransaction.rows[i].date.getFullYear()} ${resTransaction.rows[i].date.getHours()}:${resTransaction.rows[i].date.getMinutes()}`
                    resTransaction.rows[i].date = dateResult;
                }
                res.render("index.hbs", {
                    title: "Home",
                    selectAccount: `/select/${id}`,
                    chooseFromRangeInAccount: `/select/${id}`,
                    transactionslength: 1,
                    accounts: resAccount.rows,
                    Transactions: resTransaction.rows.slice(0, 5)
                });
            });
        });
    });
});

app.get("/select/:accountid/pagePrevious/:transactionslength", function(req, res){
    let length = req.params.transactionslength;
    const id = req.params.accountid;
    if (length > 1) {
        pool.query('SELECT * FROM account', (errAccount, resAccount) => {
            if (errAccount) throw errAccount
            pool.query(`SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID where Expenditure.AccountID = ${id} union all SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID where Income.AccountID = ${id} order by Date desc;`, (errTransaction, resTransaction) => {
                if (errTransaction) throw errTransaction
                pool.query(`select * from transactions order by Date desc`, (errAllTransaction, resAllTransaction) => {
                    if (errAllTransaction) throw errAllTransaction
                    CountTransactionInAllAccounts(resAllTransaction.rows, resAccount.rows);
                    for (let i = 0; i < resTransaction.rows.length; i++) {
                        let dateResult = `${resTransaction.rows[i].date.getDate()}-${resTransaction.rows[i].date.getMonth() + 1}-${resTransaction.rows[i].date.getFullYear()} ${resTransaction.rows[i].date.getHours()}:${resTransaction.rows[i].date.getMinutes()}`
                        resTransaction.rows[i].date = dateResult;
                    }
                    res.render("index.hbs", {
                        title: "Home",
                        selectAccount: `/select/${id}`,
                        chooseFromRangeInAccount: `/select/${id}`,
                        transactionslength: Number(length) - 1,
                        accounts: resAccount.rows,
                        Transactions: resTransaction.rows.slice((Number(length)-2)*5, (Number(length)-1)*5)
                    });
                });
            });
        });
    } else {
        res.redirect(`/select/${id}`);
    }
});

app.get("/select/:accountid/pageNext/:transactionslength", function(req, res){
    const id = req.params.accountid;
    let length = req.params.transactionslength;
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query(`SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID where Expenditure.AccountID = ${id} union all SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID where Income.AccountID = ${id} order by Date desc;`, (errTransaction, resTransaction) => {
            if (errTransaction) throw errTransaction
            pool.query(`select * from transactions order by Date desc`, (errAllTransaction, resAllTransaction) => {
                if (errAllTransaction) throw errAllTransaction
                    CountTransactionInAllAccounts(resAllTransaction.rows, resAccount.rows);
                    for (let i = 0; i < resTransaction.rows.length; i++) {
                        let dateResult = `${resTransaction.rows[i].date.getDate()}-${resTransaction.rows[i].date.getMonth() + 1}-${resTransaction.rows[i].date.getFullYear()} ${resTransaction.rows[i].date.getHours()}:${resTransaction.rows[i].date.getMinutes()}`
                        resTransaction.rows[i].date = dateResult;
                    }
                if (resTransaction.rows.slice(length*5, (Number(length) + 1)*5).length != 0) {
                    res.render("index.hbs", {
                        title: "Home",
                        selectAccount: `/select/${id}`,
                        chooseFromRangeInAccount: `/select/${id}`,
                        transactionslength: Number(length) + 1,
                        accounts: resAccount.rows,
                        Transactions: resTransaction.rows.slice(length*5, (Number(length) + 1)*5)
                    });
                } else {
                    res.redirect(`/select/${id}/pageNext/${length - 1}`);
                }
            });
        });
    });
});

app.get("/edit/:accountsid", function(req, res){
    const id = req.params.accountsid;
    pool.query(`SELECT * FROM account WHERE accountid=${id}`, function(err, data) {
        if(err) return console.log(err);
        res.render("edit_account.hbs", {
            edit: data.rows[0]
        });
    });
});

app.post("/editAccount", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    const id = req.body.editAccountId;
    const name = req.body.editAccountName;
    const descr = req.body.editAccountDescr;
    pool.query(`UPDATE account SET name='${name}', description='${descr}' WHERE accountid=${id}`, function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/create_transaction", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    const name = req.body.createAccountName;
    const description = req.body.createAccountDescr;
    const money = req.body.createAccountMoney;
    pool.query(`INSERT INTO accounts(name, description, money, currency) VALUES ('${name}', '${description}', ${money}, 'UAN')`, (err, data) => {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/create_transaction_income", function(request, response){
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query('SELECT * FROM category', (errCategory, resCategory) => {
            if (errCategory) throw errCategory
            response.render("create_transaction.hbs", {
                title: "Add Transaction",
                plus_minus: "income",
                accounts: resAccount.rows,
                category: resCategory.rows,
            });
        });
    });
});

app.get("/create_transaction_expenditure", function(request, response){
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query('SELECT * FROM category', (errCategory, resCategory) => {
            if (errCategory) throw errCategory
            response.render("create_transaction.hbs", {
                title: "Add Transaction",
                plus_minus: "expenditure",
                accounts: resAccount.rows,
                category: resCategory.rows,
            });
        });
    });
});

app.post("/add_transaction_income", urlencodedParser, function (req, res) {      
    if(!req.body) return res.sendStatus(400);
    const category = req.body.createTrasactionCategory;
    const money = req.body.createTrasactionMoney;
    const date = new Date();
    const account = req.body.createTrasactionAccount;
    const dateResult = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
    console.log(dateResult)
    pool.query(`INSERT INTO income(categoryid, accountid, money, date) VALUES (${category}, ${account}, ${money}, '${dateResult}')`, (err, data) => {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/add_transaction_expenditure", urlencodedParser, function (req, res) { 
    if(!req.body) return res.sendStatus(400);
    const category = req.body.createTrasactionCategory;
    const money = req.body.createTrasactionMoney;
    const date = new Date();
    const account = req.body.createTrasactionAccount;
    const dateResult = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
    pool.query(`INSERT INTO expenditure(categoryid, accountid, money, date) VALUES (${category}, ${account}, -${money}, '${dateResult}')`, (err, data) => {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/deleteTransaction/:expenditureid/:money", function(req, res){   
    const id = req.params.expenditureid;
    const money = req.params.money;
    if (money >= 0) {
        pool.query(`DELETE FROM income WHERE incomeid=${id}`, function(err, data) {
            if(err) return console.log(err);
            res.redirect("/");
        });
    } else {
        pool.query(`DELETE FROM expenditure WHERE expenditureid=${id}`, function(err, data) {
            if(err) return console.log(err);
            res.redirect("/");
        });
    }
});

app.get("/editTransaction/:expenditureid/:money", function(req, res){
    const id = req.params.expenditureid;
    const money = req.params.money;
    if (money >= 0) {
        pool.query('SELECT * FROM account', (errAccount, resAccount) => {
            if (errAccount) throw errAccount
            pool.query('SELECT * FROM category', (errCategory, resCategory) => {
                if (errCategory) throw errCategory
                pool.query(`SELECT * FROM income WHERE incomeid=${id}`, function(err, data) {
                    if(err) return console.log(err);
                    res.render("edit_transaction.hbs", {
                        edit: data.rows[0],
                        accounts: resAccount.rows,
                        category: resCategory.rows,
                    });
                });
            });
        });
    } else {
        pool.query('SELECT * FROM account', (errAccount, resAccount) => {
            if (errAccount) {
              throw errAccount
            }
            pool.query('SELECT * FROM category', (errCategory, resCategory) => {
                if (errCategory) {
                  throw errCategory
                }
                pool.query(`SELECT * FROM expenditure WHERE expenditureid=${id}`, function(err, data) {
                    if(err) return console.log(err);
                    res.render("edit_transaction.hbs", {
                        edit: data.rows[0],
                        accounts: resAccount.rows,
                        category: resCategory.rows,
                    });
                });
            });
        });
    }
});

app.post("/editTransaction", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    const id = req.body.editTransactionId;
    const account = req.body.editTransactionAccount;
    const category = req.body.editTransactionCategory;
    const money = req.body.editTransactionMoney;
    if (money >= 0) {
        pool.query(`UPDATE income SET categoryid=${category}, accountid=${account}, money=${money} WHERE incomeid=${id}`, function(err, data) {
            if(err) return console.log(err);
            res.redirect("/");
        });
    } else {
        pool.query(`UPDATE expenditure SET categoryid=${category}, accountid=${account}, money=${money} WHERE expenditureid=${id}`, function(err, data) {
            if(err) return console.log(err);
            res.redirect("/");
        });
    }
});

app.post("/chooseFromRange", urlencodedParser, function(request, response){
    const start = request.body.DateStart;
    const end = request.body.DateEnd;
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query(`SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID WHERE Date::timestamp > '${start}' AND Date::timestamp < '${end}' union all SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID WHERE Date::timestamp > '${start}' AND Date::timestamp < '${end}' order by Date desc;`, (errTransaction, resTransaction) => {
            if (errTransaction) throw errTransaction
            pool.query(`select * from transactions order by Date desc`, (errAllTransaction, resAllTransaction) => {
                if (errAllTransaction) throw errAllTransaction
                CountTransactionInAllAccounts(resAllTransaction.rows, resAccount.rows);
                for (let i = 0; i < resTransaction.rows.length; i++) {
                    let dateResult = `${resTransaction.rows[i].date.getDate()}-${resTransaction.rows[i].date.getMonth() + 1}-${resTransaction.rows[i].date.getFullYear()} ${resTransaction.rows[i].date.getHours()}:${resTransaction.rows[i].date.getMinutes()}`
                    resTransaction.rows[i].date = dateResult;
                }
                response.render("index.hbs", {
                    title: "Home",
                    pagesDisplay: "d-n",
                    chooseFromRange: "/chooseFromRange",
                    transactionslength: 1,
                    accounts: resAccount.rows,
                    Transactions: resTransaction.rows
                });
            });
        });
    });
});

app.post("/select/:accountid/chooseFromRange", urlencodedParser, function(request, response){
    const id = request.params.accountid;
    const start = request.body.DateStart;
    const end = request.body.DateEnd;
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        pool.query(`SELECT * FROM Expenditure LEFT JOIN Category ON Expenditure.CategoryID = Category.CategoryID WHERE Date::timestamp > '${start}' AND Date::timestamp < '${end}' AND Expenditure.AccountID = ${id} union all SELECT * FROM Income LEFT JOIN Category ON Income.CategoryID = Category.CategoryID WHERE Date::timestamp > '${start}' AND Date::timestamp < '${end}' AND Income.AccountID = ${id} order by Date desc;`, (errTransaction, resTransaction) => {
            if (errTransaction) throw errTransaction
            pool.query(`select * from transactions order by Date desc`, (errAllTransaction, resAllTransaction) => {
                if (errAllTransaction) throw errAllTransaction
                CountTransactionInAllAccounts(resAllTransaction.rows, resAccount.rows);
                for (let i = 0; i < resTransaction.rows.length; i++) {
                    let dateResult = `${resTransaction.rows[i].date.getDate()}-${resTransaction.rows[i].date.getMonth() + 1}-${resTransaction.rows[i].date.getFullYear()} ${resTransaction.rows[i].date.getHours()}:${resTransaction.rows[i].date.getMinutes()}`
                    resTransaction.rows[i].date = dateResult;
                }
                response.render("index.hbs", {
                    title: "Home",
                    pagesDisplay: "d-n",
                    chooseFromRange: `/select/${id}/chooseFromRange`,
                    transactionslength: 1,
                    accounts: resAccount.rows,
                    Transactions: resTransaction.rows
                });
            });
        });
    });
});

// ============================================================================= //

app.get("/target", function(request, response){
    pool.query('SELECT * FROM target', (errTarget, resTarget) => {
        if (errTarget) throw errTarget
        pool.query(`SELECT * FROM targetstep;`, (errTargetStep, resTargetStep) => {
            if (errTargetStep) throw errTargetStep
            for (let j = 0; j < resTarget.rows.length; j++) {
                let sum = 0;
                for (let i = 0; i < resTargetStep.rows.length; i++) {
                    if (resTargetStep.rows[i].targetid == resTarget.rows[j].targetid) {
                        resTarget.rows[j].totalplannedamount = Number(resTarget.rows[j].totalplannedamount) - Number(resTargetStep.rows[i].plannedamount);
                        sum += Number(resTargetStep.rows[i].plannedamount);
                        let dateResultStep = `${resTargetStep.rows[i].planneddate.getDate()}-${resTargetStep.rows[i].planneddate.getMonth() + 1}-${resTargetStep.rows[i].planneddate.getFullYear()} ${resTargetStep.rows[i].planneddate.getHours()}:${resTargetStep.rows[i].planneddate.getMinutes()}`;
                        resTargetStep.rows[i].planneddate = dateResultStep;
                    }
                }
                if (resTarget.rows[j].totalplannedamount <= 0) {
                    const date = new Date();
                    const dateResult = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
                    pool.query(`INSERT INTO income(categoryid, accountid, money, date) VALUES (${8}, ${resTarget.rows[j].accountid}, ${sum}, '${dateResult}')`, (err, data) => {
                        if(err) return console.log(err);
                    });
                    pool.query(`DELETE FROM targetstep WHERE targetid=${resTarget.rows[j].targetid}`, function(err, data) {
                        if(err) return console.log(err);
                    });
                    pool.query(`DELETE FROM target WHERE targetid=${resTarget.rows[j].targetid}`, function(err, data) {
                        if(err) return console.log(err);
                    });
                    resTarget.rows.splice(j, 1);
                }
            }
            response.render("target.hbs", {
                title: "Target",
                targets: resTarget.rows,
            });
        });
    });
}); 

app.get("/create_target", function(request, response){
    pool.query('SELECT * FROM account', (errAccount, resAccount) => {
        if (errAccount) throw errAccount
        response.render("create_target.hbs", {
            title: "Create Target",
            accounts: resAccount.rows,
        });
    });
});

app.post("/create_target", urlencodedParser, function (req, res) {       
    if(!req.body) return res.sendStatus(400);
    const name = req.body.createTargetName;
    const accountid = req.body.createTargetAccount;
    const money = req.body.createTargetMoney;
    pool.query(`INSERT INTO target(accountid, name, totalplannedamount) VALUES (${accountid}, '${name}', ${money})`, (err, data) => {
        if(err) return console.log(err);
        res.redirect("/target");
    });
});

app.post("/deleteTarget/:targetid", function(req, res){
    const id = req.params.targetid;
    pool.query(`DELETE FROM targetstep WHERE targetid=${id}`, function(err, data) {
        if(err) return console.log(err);
    });
    pool.query(`DELETE FROM target WHERE targetid=${id}`, function(err, data) {
        if(err) return console.log(err);
        res.redirect("/target");
    });
});

app.get("/create_targetstep", function(request, response){
    pool.query('SELECT * FROM target', (errTarget, resTarget) => {
        if (errTarget) throw errTarget
        response.render("create_targetStep.hbs", {
            title: "Create Target Step",
            targets: resTarget.rows,
        });
    });
});

app.get("/selectTarget/:targetid", function(req, res){
    const id = req.params.targetid;
    pool.query('SELECT * FROM target', (errTarget, resTarget) => {
        if (errTarget) throw errTarget
        pool.query(`SELECT * FROM targetstep where targetstep.targetid = ${id};`, (errTargetStep, resTargetStep) => {
            if (errTargetStep) throw errTargetStep
            for (let j = 0; j < resTarget.rows.length; j++) {
                let sum = 0;
                for (let i = 0; i < resTargetStep.rows.length; i++) {
                    if (resTargetStep.rows[i].targetid == resTarget.rows[j].targetid) {
                        resTarget.rows[j].totalplannedamount = Number(resTarget.rows[j].totalplannedamount) - Number(resTargetStep.rows[i].plannedamount);
                        sum += Number(resTargetStep.rows[i].plannedamount);
                        let dateResultStep = `${resTargetStep.rows[i].planneddate.getDate()}-${resTargetStep.rows[i].planneddate.getMonth() + 1}-${resTargetStep.rows[i].planneddate.getFullYear()} ${resTargetStep.rows[i].planneddate.getHours()}:${resTargetStep.rows[i].planneddate.getMinutes()}`;
                        resTargetStep.rows[i].planneddate = dateResultStep;
                    }
                }
                if (resTarget.rows[j].totalplannedamount <= 0) {
                    const date = new Date();
                    const dateResult = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
                    pool.query(`INSERT INTO income(categoryid, accountid, money, date) VALUES (${8}, ${resTarget.rows[j].accountid}, ${sum}, '${dateResult}')`, (err, data) => {
                        if(err) return console.log(err);
                    });
                    pool.query(`DELETE FROM targetstep WHERE targetid=${resTarget.rows[j].targetid}`, function(err, data) {
                        if(err) return console.log(err);
                    });
                    pool.query(`DELETE FROM target WHERE targetid=${resTarget.rows[j].targetid}`, function(err, data) {
                        if(err) return console.log(err);
                    });
                    resTargetStep = []
                    resTarget.rows.splice(j, 1);
                }
            }
            res.render("target.hbs", {
                title: "Target",
                targets: resTarget.rows,
                targetSteps: resTargetStep.rows
            });
        });
    });
});

app.post("/create_targetstep", urlencodedParser, function (req, res) {       
    if(!req.body) return res.sendStatus(400);
    const targetid = req.body.createTargetstepTarget;
    const money = req.body.createTargetstepMoney;
    const date = new Date();
    const dateResult = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    if (money != '') {
        pool.query(`INSERT INTO targetstep(targetid, plannedamount, planneddate) VALUES (${targetid}, ${money}, '${dateResult}')`, (err, data) => {
            if(err) return console.log(err);
            res.redirect(`/selectTarget/${targetid}`);
        });
    } else {
        pool.query(`INSERT INTO targetstep(targetid, planneddate) values (${targetid}, '${dateResult}')`, (err, data) => {
            if(err) return console.log(err);
            res.redirect(`/selectTarget/${targetid}`);
        });
    }
});

app.post("/deleteTargetStep/:targetstepid", function(req, res){   
    const id = req.params.targetstepid;
    pool.query(`DELETE FROM targetstep WHERE targetstepid=${id}`, function(err, data) {
        if(err) return console.log(err);
        res.redirect("/target");
    });
});

app.listen(8080);