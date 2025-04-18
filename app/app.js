import express from "express";

import {
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
  accountExists,
  rateExists,
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

  if (!accountId || balance === undefined || balance === null) {
    return res.status(400).json({ error: "Malformed request" });
  }

  if (isNaN(Number(accountId)) || isNaN(Number(balance))) {
    return res.status(400).json({ error: "Account ID and balance must be valid numbers" });
  }

  const exists = await accountExists(accountId);
  if (!exists) {
    return res.status(404).json({ error: "Account not found" });
  }

  try {
    await setAccountBalance(accountId, balance);
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
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

  if (isNaN(Number(rate))) {
    return res.status(400).json({ error: "Rate must be valid number" });
  }

  if (typeof counterCurrency !== "string" || typeof baseCurrency !== "string") {
    return res.status(400).json({ error: "Currencies must be a string" });
  }

  if (rate <= 0) {
    return res.status(404).json({ error: "Rate must be positive" });
  }

  const [baseExists, counterExists] = await Promise.all([
    rateExists(baseCurrency),
    rateExists(counterCurrency),
  ]);
  if (!baseExists || !counterExists) {
    return res.status(404).json({ error: "One or both currencies do not exist" });
  }

  if (baseCurrency == counterCurrency) {
    return res.status(404).json({ error: "Currencies cannot be the same" });
  }


  await setRate(req.body);
  const rates = await getRates();
  res.json(rates);
});

// LOG endpoint

app.get("/log", async (req, res) => {
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

  // Validación de request mal formado
  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    baseAmount === undefined ||
    baseAmount === null
  ) {
    return res.status(400).json({ error: "Malformed request" });
  }

  if (isNaN(Number(baseAmount)) || isNaN(Number(baseAccountId)) || isNaN(Number(counterAccountId))) {
    return res.status(400).json({ error: "Rate must be valid number" });
  }

  if (typeof baseCurrency !== "string" || typeof counterCurrency !== "string") {
    return res.status(400).json({ error: "Currencies must be a string" });
  }

  if (baseCurrency === counterCurrency) {
    return res.status(400).json({ error: "Currencies must be different" });
  }

  if (baseAccountId === counterAccountId) {
    return res.status(400).json({ error: "Accounts must be different" });
  }

  if (Number(baseAmount) <= 0) {
    return res.status(400).json({ error: "Amount must be positive" });
  }

  const [baseExists, counterExists] = await Promise.all([
    accountExists(baseAccountId),
    accountExists(counterAccountId),
  ]);
  if (!baseExists || !counterExists) {
    return res.status(404).json({ error: "One or both accounts do not exist" });
  }

  const [rateExistsA, rateExistsB] = await Promise.all([
    rateExists(baseCurrency),
    rateExists(counterCurrency),
  ]);
  if (!rateExistsA || !rateExistsB) {
    return res.status(404).json({ error: "Exchange rate does not exist" });
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
