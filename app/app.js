import express from "express";
import v1Router from "./routers/v1Router.js";
import v11Router from "./routers/v11Router.js";
import v2Router from "./routers/v2Router.js";

/*
import {
  getStartTime,
  registerResponseTime,
  addVolumeForCurrency,
  addNetVolume,
  countSuccess,
  countError
} from "./metrics.js";

import {
  evaluateFieldsForAccount,
  evaluateFieldsForSetBalance,
  evaluateFieldsForRate,
  evaluateFieldsForExchange
} from "./validations.js";

import {
  init as exchangeInit,
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";

import {
  init as exchangeInitV2,
  getAccounts as getAccountsV2,
  createAccount as createAccountV2, // only in v2
  setAccountBalance as setAccountBalanceV2,
  getRates as getRatesV2,
  setRate as setRateV2,
  getLog as getLogV2,
  exchange as exchangeV2,
} from "./exchange-v2.js";
*/

//await exchangeInit();

const app = express();
const port = 3000;

// Version 1 (original)
//const v1Router = require('./routes/v1Router');

// Version 1.1 (original + validations)
//const v11Router = require('./routes/v11Router');

// Version 2 (with redis)
//const v2Router = require('./routes/v2Router');

app.use(express.json());

// Register routes
app.use('/', v1Router); // default route for original v1Router
app.use('/v1', v1Router); // original v1Router
app.use('/v1.1', v11Router); // original + validations Router
app.use('/v2', v2Router); // redis implementation Router

/*
// -----------------------------------------------------------------------------
// V1 endpoints

// ACCOUNTS endpoints
// -----------------------------------------------------------
v1Router.get("/accounts", async (req, res) => {
  const start = getStartTime();
  res.json(await getAccounts());
  registerResponseTime("accounts_get_response_time", start);
});

// -----------------------------------------------------------
v1Router.put("/accounts/:id/balance", async (req, res) => {
  const start = getStartTime();
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    await setAccountBalance(accountId, balance);

    res.json(await getAccounts());
    registerResponseTime("accounts_put_response_time", start);
  }

  if (toAccountId === undefined) {
    return res.status(400).json({ error: "Missing field: toAccountId" });
  }

  if (amount === undefined) {
    return res.status(400).json({ error: "Missing field: amount" });

  }

  if (!Number.isInteger(fromAccountId) || fromAccountId <= 0) {
    return res.status(400).json({ error: "Invalid fromAccountId. Must be a positive integer." });
  }

  if (!Number.isInteger(toAccountId) || toAccountId <= 0) {
    return res.status(400).json({ error: "Invalid toAccountId. Must be a positive integer." });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
  }

  const accounts = getAccounts();
  const fromAccount = accounts.find(acc => acc.id === fromAccountId);
  const toAccount = accounts.find(acc => acc.id === toAccountId);

  if (!fromAccount || !toAccount) {
    return res.status(404).json({ error: "One or both accounts not found." });
  }

  if (fromAccount.currency !== toAccount.currency) {
    return res.status(400).json({ error: "Accounts must have the same currency" });
  }

  if (fromAccount.balance < amount) {
    return res.status(400).json({ error: "Insufficient funds in source account." });
  }

  setAccountBalance(fromAccountId, fromAccount.balance - amount);
  setAccountBalance(toAccountId, toAccount.balance + amount);

  res.status(200).json({
    message: "Transfer completed successfully",
    fromAccountId,
    toAccountId,
    amount
  });
});

// RATE endpoints
// -----------------------------------------------------------
v1Router.get("/rates", async (req, res) => {
  const start = getStartTime();
  res.json(await getRates());
  registerResponseTime("rates_get_response_time", start);
});

// -----------------------------------------------------------
v1Router.put("/rates", async (req, res) => {
  const start = getStartTime();
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  await setRate(newRateRequest);

  res.json(await getRates());
  registerResponseTime("rates_put_response_time", start);
});

// LOG endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v1Router.get("/log", async (req, res) => {
  const start = getStartTime();
  res.json(await getLog());
  registerResponseTime("log_get_response_time", start);
});


// EXCHANGE endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v1Router.post("/exchange", async (req, res) => {
  const start = getStartTime();
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;


  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    !baseAmount
  ) {
    countError("exchange");
    registerResponseTime("exchange_post_response_time", start);
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);
  const counterAmount = exchangeResult.counterAmount;

  addVolumeForCurrency(baseCurrency, baseAmount);
  addVolumeForCurrency(counterCurrency, counterAmount);
  
  addNetVolume(baseCurrency, -baseAmount);
  addNetVolume(counterCurrency, counterAmount);

  if (exchangeResult.ok) {
    countSuccess("exchange");
    registerResponseTime("exchange_post_response_time", start);
    res.status(200).json(exchangeResult);
  } else {
    countError("exchange");
    registerResponseTime("exchange_post_response_time", start);
    res.status(500).json(exchangeResult);
  }
});


// -----------------------------------------------------------------------------
// V1.1 endpoints

// ACCOUNTS endpoints
// -----------------------------------------------------------
v11Router.get("/accounts", async (req, res) => {
  const start = getStartTime();

  console.log("GET /accounts");

  res.json(await getAccounts());
  registerResponseTime("accounts_get_response_time", start);
});

// -----------------------------------------------------------
v11Router.put("/accounts/:id/balance", async (req, res) => {
  const start = getStartTime();
  const accountId = req.params.id;
  const { balance } = req.body;

  console.log("PUT /accounts/" + accountId + "/balance");

  const fieldError = evaluateFieldsForSetBalance(accountId, balance);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  }
  
  setAccountBalance(accountId, balance);

  res.json(getAccounts());
  registerResponseTime("accounts_put_response_time", start);
});

// RATE endpoints
// -----------------------------------------------------------
v11Router.get("/rates", async (req, res) => {
  const start = getStartTime();

  console.log("GET /rates");

  res.json(await getRates());
  registerResponseTime("rates_get_response_time", start);
});

// -----------------------------------------------------------
v11Router.put("/rates", async (req, res) => {
  const start = getStartTime();
  const { baseCurrency, counterCurrency, rate } = req.body;

  console.log("PUT /rates");

  const fieldError = evaluateFieldsForRate(baseCurrency, counterCurrency, rate);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  }

  const newRateRequest = { ...req.body };
  await setRate(newRateRequest);

  res.json(await getRates());
  registerResponseTime("rates_put_response_time", start);
});

// LOG endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v11Router.get("/log", async (req, res) => {
  const start = getStartTime();
  
  console.log("GET /log");

  res.json(await getLog());
  registerResponseTime("log_get_response_time", start);
});


// EXCHANGE endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v11Router.post("/exchange", async (req, res) => {
  const start = getStartTime();
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  console.log("POST /exchange");

  const fieldError = evaluateFieldsForExchange(baseCurrency, counterCurrency, baseAccountId, counterAccountId, baseAmount);
  if (fieldError) {
    countError("exchange");
    registerResponseTime("exchange_post_response_time", start);
    return res.status(400).json({ error: fieldError });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);
  const counterAmount = exchangeResult.counterAmount;

  addVolumeForCurrency(baseCurrency, baseAmount);
  addVolumeForCurrency(counterCurrency, counterAmount);
  
  addNetVolume(baseCurrency, -baseAmount);
  addNetVolume(counterCurrency, counterAmount);

  if (exchangeResult.ok) {
    countSuccess("exchange");
    registerResponseTime("exchange_post_response_time", start);
    res.status(200).json(exchangeResult);
  } else {
    countError("exchange");
    registerResponseTime("exchange_post_response_time", start);
    res.status(500).json(exchangeResult);
  }
});


// -----------------------------------------------------------------------------
// V2 endpoints
// -----------------------------------------------------------------------------

// ACCOUNTS endpoints
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.get("/accounts", async (req, res) => {
  const start = getStartTime();

  console.log("GET /accounts (V2)");

  res.json(await getAccountsV2());
  registerResponseTime("accounts_get_response_time", start);
});

// -----------------------------------------------------------
v2Router.post("/accounts", async (req, res) => {
  const start = getStartTime();
  const { id, currency, balance } = req.body;

  console.log("POST /accounts (V2)");  

  const fieldError = evaluateFieldsForAccount(id, currency, balance);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  } else {
    createAccountV2(id, currency, balance);

    res.json(await getAccountsV2());
    registerResponseTime("accounts_post_response_time", start);
  }
});

// -----------------------------------------------------------
v2Router.put("/accounts/:id/balance", async (req, res) => {
  const start = getStartTime();
  const accountId = req.params.id;
  const { balance } = req.body;

  console.log("PUT /accounts/" + accountId + "/balance (V2)");

  const fieldError = evaluateFieldsForSetBalance(accountId, balance);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  } else {
    await setAccountBalanceV2(accountId, balance);

    res.json(await getAccountsV2());
    registerResponseTime("accounts_put_response_time", start);
  }
});


// RATE endpoints
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.get("/rates", async (req, res) => {
  const start = getStartTime();

  console.log("GET /rates (V2)");

  res.json(await getRatesV2());
  registerResponseTime("rates_get_response_time", start);
});

// -----------------------------------------------------------
v2Router.put("/rates", async (req, res) => {
  const start = getStartTime();
  const { baseCurrency, counterCurrency, rate } = req.body;

  console.log("PUT /rates (V2)");

  const fieldError = evaluateFieldsForRate(baseCurrency, counterCurrency, rate);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  }

  const newRateRequest = { ...req.body };
  await setRateV2(newRateRequest);

  res.json(await getRatesV2());
  registerResponseTime("rates_put_response_time", start);
});


// LOG endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.get("/log", async (req, res) => {
  const start = getStartTime();

  console.log("GET /log (V2)");

  res.json(await getLogV2());
  registerResponseTime("log_get_response_time", start);
});


// EXCHANGE endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.post("/exchange", async (req, res) => {
  const start = getStartTime();
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  console.log("POST /exchange (V2)");

  const fieldError = evaluateFieldsForExchange(baseCurrency, counterCurrency, baseAccountId, counterAccountId, baseAmount);
  if (fieldError) {
    countError("exchange");
    registerResponseTime("exchange_post_response_time", start);
    return res.status(400).json({ error: fieldError });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);
  const counterAmount = exchangeResult.counterAmount;

  addVolumeForCurrency(baseCurrency, baseAmount);
  addVolumeForCurrency(counterCurrency, counterAmount);
  
  addNetVolume(baseCurrency, -baseAmount);
  addNetVolume(counterCurrency, counterAmount);

  if (exchangeResult.ok) {
    countSuccess("exchange");
    registerResponseTime("exchange_post_response_time", start);
    res.status(200).json(exchangeResult);
  } else {
    countError("exchange");
    registerResponseTime("exchange_post_response_time", start);
    res.status(500).json(exchangeResult);
  }
});
*/

// -----------------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
