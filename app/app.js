import express from "express";
import dotenv from "dotenv";

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

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", async (req, res) => {
  console.log("GET /accounts");
  res.json(await getAccounts());
});

app.post("/accounts", async (req, res) => {
  const { id, currency, balance } = req.body;
  console.log("POST /accounts");  

  if (!id || !currency || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    createAccount(id, currency, balance);

    res.json(await getAccounts());
  }
});

app.put("/accounts/:id/balance", async (req, res) => {
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

app.get("/rates", async (req, res) => {
  console.log("GET /rates");
  res.json(await getRates());
});

app.post("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  console.log("POST /rates");

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  await setRate(newRateRequest);

  res.json(await getRates());
});

app.put("/rates", async (req, res) => {
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

app.get("/log", async (req, res) => {
  console.log("GET /log");

  res.json(await getLog());
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
