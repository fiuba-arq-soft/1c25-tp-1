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