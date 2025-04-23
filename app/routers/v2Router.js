import express from "express";

import {
    init as exchangeInitV2,
    getAccounts as getAccountsV2,
    createAccount as createAccountV2, // only in v2
    setAccountBalance as setAccountBalanceV2,
    getRates as getRatesV2,
    setRate as setRateV2,
    getLog as getLogV2,
    exchange as exchangeV2,
} from "../exchange-v2.js";

import {
    getStartTime,
    registerResponseTime,
    addVolumeForCurrency,
    addNetVolume,
    countSuccess,
    countError
} from "../utils/metrics.js";

// -----------------------------------------------------------------------------
// V2 endpoints
// -----------------------------------------------------------------------------

const v2Router = express.Router();

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
    console.log(req.body);
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

export default v2Router;