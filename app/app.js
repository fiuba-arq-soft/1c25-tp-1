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

// TRANSFER endpoint
app.post("/transfer", (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;

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

  const accounts = getAccounts();
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

  setAccountBalance(fromAccountId, fromAccount.balance - amount);
  setAccountBalance(toAccountId, toAccount.balance + amount);

  res.status(200).json({
    message: "Transfer completed successfully",
    fromAccountId,
    toAccountId,
    amount
  });
});

// RATE endpoints

app.get("/rates", (req, res) => {
  console.log("GET /rates");
  res.json(getRates());
});

app.put("/rates", (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  console.log("PUT /rates");

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
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

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
