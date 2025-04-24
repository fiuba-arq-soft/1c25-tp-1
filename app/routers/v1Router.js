import express from "express";

import {
    init as exchangeInit,
    getAccounts,
    setAccountBalance,
    getRates,
    setRate,
    getLog,
    exchange,
} from "../exchange.js";

import {
    getStartTime,
    registerResponseTime,
    addVolumeForCurrency,
    addNetVolume,
    countSuccess,
    countError
} from "../utils/metrics.js";

// -----------------------------------------------------------------------------
// V1 endpoints

const v1Router = express.Router();

await exchangeInit();

// ACCOUNTS endpoints
// -----------------------------------------------------------
v1Router.get("/accounts", async (req, res) => {
    const start = getStartTime();
    console.log("GET /accounts");
    res.json(await getAccounts());
    registerResponseTime("accounts_get_response_time", start);
});

// -----------------------------------------------------------
v1Router.post("/transfer", async (req, res) => {
  const start = getStartTime();
  const { fromAccountId, toAccountId, amount } = req.body;
  console.log("POST /transfer");

  if (fromAccountId === undefined) {
    return res.status(400).json({ error: "Missing field: fromAccountId" });
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

  const accounts = await getAccounts();
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

  await setAccountBalance(fromAccountId, fromAccount.balance - amount);
  await setAccountBalance(toAccountId, toAccount.balance + amount);

  res.status(200).json({
    message: "Transfer completed successfully",
    fromAccountId,
    toAccountId,
    amount
  });
  registerResponseTime("accounts_transfer_response_time", start);
});

// -----------------------------------------------------------
v1Router.put("/accounts/:id/balance", async (req, res) => {
    const start = getStartTime();
    const accountId = req.params.id;
    const { balance } = req.body;
    console.log("PUT /accounts/" + accountId + "/balance (V2)");

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
    console.log("GET /rates");
    res.json(await getRates());
    registerResponseTime("rates_get_response_time", start);
});
  
// -----------------------------------------------------------
v1Router.put("/rates", async (req, res) => {
    const start = getStartTime();
    const { baseCurrency, counterCurrency, rate } = req.body;
    console.log("PUT /rates");
  
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
    console.log("GET /log");

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
    
    console.log("POST /exchange");

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

export default v1Router;