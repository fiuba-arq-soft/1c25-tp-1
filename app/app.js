import express from "express";

import {
  init as exchangeInit,
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", (req, res) => {
  console.log("GET /accounts");
  res.json(getAccounts());
});

app.put("/accounts/:id/balance", (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  console.log("PUT /accounts/" + accountId + "/balance");

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    setAccountBalance(accountId, balance);

    res.json(getAccounts());
  }
});

// RATE endpoints

app.get("/rates", (req, res) => {
  console.log("GET /rates");
  res.json(getRates());
});

app.put("/rates", (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (baseCurrency === undefined) {
    return res.status(400).json({ error: "Missing field: baseCurrency" });
  }

  if (counterCurrency === undefined) {
    return res.status(400).json({ error: "Missing field: counterCurrency" });
  }

  if (rate === undefined) {
    return res.status(400).json({ error: "Missing field: rate" });
  }

  if (typeof baseCurrency !== "string" || baseCurrency.length !== 3) {
    return res.status(400).json({
      error: "Invalid baseCurrency: must be a 3-character string"
    });
  }

  // Validación de counterCurrency
  if (typeof counterCurrency !== "string" || counterCurrency.length !== 3) {
    return res.status(400).json({
      error: "Invalid counterCurrency: must be a 3-character string"
    });
  }

  if (!Number.isInteger(rate) || rate <= 0) {
    return res.status(400).json({
      error: "Invalid rate: must be an integer greater than 0"
    });
  }

  const newRateRequest = { ...req.body };
  setRate(newRateRequest);

  res.json(getRates());
});

// LOG endpoint

app.get("/log", (req, res) => {
  console.log("GET /log");

  res.json(getLog());
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  if (baseCurrency === undefined) {
    return res.status(400).json({ error: "Missing field: baseCurrency" });
  }

  if (counterCurrency === undefined) {
    return res.status(400).json({ error: "Missing field: counterCurrency" });
  }

  if (baseAccountId === undefined) {
    return res.status(400).json({ error: "Missing field: baseAccountId" });
  }

  if (counterAccountId === undefined) {
    return res.status(400).json({ error: "Missing field: counterAccountId" });
  }

  if (baseAmount === undefined) {
    return res.status(400).json({ error: "Missing field: baseAmount" });
  }

  if (typeof baseCurrency !== "string" || baseCurrency.length !== 3) {
    return res.status(400).json({
      error: "Invalid baseCurrency: must be a 3-character string"
    });
  }

  if (typeof counterCurrency !== "string" || counterCurrency.length !== 3) {
    return res.status(400).json({ 
      error: "Invalid counterCurrency must be a 3-character string" 
    });
  }

  if (!Number.isInteger(baseAccountId) || baseAccountId <= 0) {
    return res.status(400).json({ error: "baseAccountId must be a positive integer" });
  }

  if (!Number.isInteger(counterAccountId) || counterAccountId <= 0) {
    return res.status(400).json({ error: "counterAccountId must be a positive integer" });
  }

  if (typeof baseAmount !== "number" || baseAmount <= 0) {
    return res.status(400).json({ error: "baseAmount must be a positive number" });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);

  if (exchangeResult.ok) {
    res.status(200).json('Currency exchange completed.');
  } else {
    res.status(500).json('An error occurred while processing the exchange.');
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
