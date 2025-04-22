import express from "express";
/*import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Determine which exchange module to use based on an environment variable
const useRedis = process.env.USE_REDIS === "true";

const exchangeModule = useRedis
  ? await import("./exchange-redis.js")
  : await import("./exchange.js");
  
const {
    init: exchangeInit,
    getAccounts,
    createAccount,
    setAccountBalance,
    getRates,
    createRate,
    setRate,
    getLog,
    exchange,
} = exchangeModule;
*/

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
app.use('/v1', v1Router);
app.use('/v2', v2Router);

// -----------------------------------------------------------------------------
// V1 endpoints

// ACCOUNTS endpoints
// -----------------------------------------------------------
v1Router.get("/accounts", async (req, res) => {
  console.log("GET /accounts");
  res.json(await getAccounts());
});

// -----------------------------------------------------------
v1Router.put("/accounts/:id/balance", async (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  console.log("PUT /accounts/" + accountId + "/balance");

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    await setAccountBalance(accountId, balance);

    res.json(await getAccounts());
  }
});

// RATE endpoints
// -----------------------------------------------------------
v1Router.get("/rates", async (req, res) => {
  console.log("GET /rates");
  res.json(await getRates());
});

// -----------------------------------------------------------
v1Router.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  console.log("PUT /rates");

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  await setRate(newRateRequest);

  res.json(await getRates());
});

// LOG endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v1Router.get("/log", async (req, res) => {
  console.log("GET /log");

  res.json(await getLog());
});


// EXCHANGE endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v1Router.post("/exchange", async (req, res) => {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  console.log("POST /exchange");

  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    !baseAmount
  ) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);

  if (exchangeResult.ok) {
    res.status(200).json(exchangeResult);
  } else {
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
  console.log("GET /accounts (V2)");
  res.json(await getAccountsV2());
});

// -----------------------------------------------------------
v2Router.post("/accounts", async (req, res) => {
  const { id, currency, balance } = req.body;
  console.log("POST /accounts (V2)");  

  if (!id || !currency || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    createAccountV2(id, currency, balance);

    res.json(await getAccountsV2());
  }
});

// -----------------------------------------------------------
v2Router.put("/accounts/:id/balance", async (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  console.log("PUT /accounts/" + accountId + "/balance (V2)");

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    await setAccountBalanceV2(accountId, balance);

    res.json(await getAccountsV2());
  }
});


// RATE endpoints
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.get("/rates", async (req, res) => {
  console.log("GET /rates (V2)");
  res.json(await getRatesV2());
});

// -----------------------------------------------------------
v2Router.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  console.log("PUT /rates (V2)");

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  await setRateV2(newRateRequest);

  res.json(await getRatesV2());
});


// LOG endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.get("/log", async (req, res) => {
  console.log("GET /log (V2)");

  res.json(await getLogV2());
});


// EXCHANGE endpoint
// -----------------------------------------------------------

// -----------------------------------------------------------
v2Router.post("/exchange", async (req, res) => {
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
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchangeV2(exchangeRequest);

  if (exchangeResult.ok) {
    res.status(200).json(exchangeResult);
  } else {
    res.status(500).json(exchangeResult);
  }
});


// -----------------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
