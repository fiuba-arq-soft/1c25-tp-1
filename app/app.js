import express from "express";

import {
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";
import { initRedis } from "./redis.js";

const app = express();
const port = 3000;

app.use(express.json());

await initRedis();

// ACCOUNT endpoints

app.get("/accounts", async (req, res) => {
  const accounts = await getAccounts();
  res.json(accounts);
});

app.put("/accounts/:id/balance", async (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    await setAccountBalance(accountId, balance);
    const accounts = await getAccounts();
    res.json(accounts);
  }
});

// RATE endpoints

app.get("/rates", async (req, res) => {
  const rates = await getRates();
  res.json(rates);
});

app.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  await setRate(newRateRequest);
  const rates = await getRates();

  res.json(rates);
});

// LOG endpoint

app.get("/log", async (req, res) => {
  console.log("Fetching log...");
  const log = await getLog();
  res.json(log);
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  console.log("Processing exchange...");
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

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
