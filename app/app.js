import express from "express";
import {
  getStartTime,
  registerResponseTime,
  addVolumeForCurrency,
  addNetVolume,
  countSuccess,
  countError
} from "./metrics.js";

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


await exchangeInit();

const app = express();
const port = 3000;

// Version 1 (original)
const v1Router = express.Router();

// Version 2 (with redis)
const v2Router = express.Router();

app.use(express.json());

// Register routes
app.use('/', v1Router); // default route for original v1Router
app.use('/v1', v1Router);
app.use('/v2', v2Router);

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

  if (!id || !currency || !balance) {
    return res.status(400).json({ error: "Malformed request" });
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

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
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

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
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
  const exchangeResult = await exchangeV2(exchangeRequest);

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

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
