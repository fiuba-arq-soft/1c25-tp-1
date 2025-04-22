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

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", (req, res) => {
  const start = getStartTime();
  res.json(getAccounts());
  registerResponseTime("accounts_get_response_time", start);
});

app.put("/accounts/:id/balance", (req, res) => {
  const start = getStartTime();
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    setAccountBalance(accountId, balance);

    res.json(getAccounts());
    registerResponseTime("accounts_put_response_time", start);
  }
});

// RATE endpoints

app.get("/rates", (req, res) => {
  const start = getStartTime();
  res.json(getRates());
  registerResponseTime("rates_get_response_time", start);
});

app.put("/rates", (req, res) => {
  const start = getStartTime();
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  setRate(newRateRequest);

  res.json(getRates());
  registerResponseTime("rates_put_response_time", start);
});

// LOG endpoint

app.get("/log", (req, res) => {
  const start = getStartTime();
  res.json(getLog());
  registerResponseTime("log_get_response_time", start);
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
