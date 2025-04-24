import express from "express";

import {
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

import {
    evaluateFieldsForTransfer,
    evaluateFieldsForSetBalance,
    evaluateFieldsForRate,
    evaluateFieldsForExchange
} from "../utils/validations.js";


// -----------------------------------------------------------------------------
// V1.1 endpoints

const v11Router = express.Router();

// ACCOUNTS endpoints
// -----------------------------------------------------------
v11Router.get("/accounts", async (req, res) => {
    const start = getStartTime();
  
    console.log("GET /accounts (v1.1)");
  
    res.json(await getAccounts());
    registerResponseTime("accounts_get_response_time", start);
});

// -----------------------------------------------------------
v11Router.post("/transfer", async (req, res) => {
  const start = getStartTime();
  const { fromAccountId, toAccountId, amount } = req.body;
  console.log("POST /transfer (v1.1)");

  const fieldError = evaluateFieldsForTransfer(fromAccountId, toAccountId, amount);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
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
v11Router.put("/accounts/:id/balance", async (req, res) => {
    const start = getStartTime();
    const accountId = req.params.id;
    const { balance } = req.body;
  
    console.log("PUT /accounts/" + accountId + "/balance (v1.1)");
  
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
  
    console.log("GET /rates (v1.1)");
  
    res.json(await getRates());
    registerResponseTime("rates_get_response_time", start);
});
  
// -----------------------------------------------------------
v11Router.put("/rates", async (req, res) => {
    const start = getStartTime();
    const { baseCurrency, counterCurrency, rate } = req.body;
  
    console.log("PUT /rates (v1.1)");
  
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
    
    console.log("GET /log (v1.1)");
  
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
  
    console.log("POST /exchange (v1.1)");
  
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

export default v11Router;