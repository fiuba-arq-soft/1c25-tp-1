import { nanoid } from "nanoid";

import {
  getAccounts as redisGetAccounts,
  createAccount as redisCreateAccount,
  getAccountById as redisGetAccountById,
  getAccountByCurrency as redisGetAccountByCurrency,
  updateAccount as redisUpdateAccount,
  getRates as redisGetRates,
  createRate as redisCreateRate,
  getRate as redisGetRate,
  updateRate as redisUpdateRate,
  getLog as redisGetLog,
  saveLog as redisSaveLog,
} from "./state-v2.js";

// Initialize Redis-backed state
export async function init() {
  // No need to initialize in-memory state, Redis functions will handle data
}

// Returns all internal accounts
export async function getAccounts() {
  return await redisGetAccounts();
}

// Creates a new account
export async function createAccount(accountId, accountCurrency, balance) {

  const account = {
    id: accountId,
    currency: accountCurrency,
    balance: balance,
  };

  await redisCreateAccount(account);
}

// Sets balance for an account
export async function setAccountBalance(accountId, balance) {
  const account = await redisGetAccountById(accountId);

  if (account != null) {
    account.balance = balance;
    await redisUpdateAccount(account);
  }
}

// Returns all current exchange rates
export async function getRates() {
  return await redisGetRates();
}

// Returns the whole transaction log
export async function getLog() {
  return await redisGetLog();
}

// Creates the exchange rate for a given pair of currencies, and the reciprocal rate as well
export async function createRate(rateRequest) {
    const { baseCurrency, counterCurrency, rate } = rateRequest;
    
    // Save the rate in Redis
    await redisCreateRate({ baseCurrency, counterCurrency, rate });
}

// Sets the exchange rate for a given pair of currencies, and the reciprocal rate as well
export async function setRate(rateRequest) {
  const { baseCurrency, counterCurrency, rate } = rateRequest;

  await redisUpdateRate({ baseCurrency, counterCurrency, rate });
}

// Executes an exchange operation
export async function exchange(exchangeRequest) {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId: clientBaseAccountId,
    counterAccountId: clientCounterAccountId,
    baseAmount,
  } = exchangeRequest;

  // Get the exchange rate
  const exchangeRate = (await redisGetRate(baseCurrency, counterCurrency))?.rate;
  if (!exchangeRate) {
    throw new Error("Exchange rate not found");
  }

  // Compute the requested (counter) amount
  const counterAmount = baseAmount * exchangeRate;

  // Find our account on the provided (base) currency
  const baseAccount = await redisGetAccountByCurrency(baseCurrency);

  // Find our account on the counter currency
  const counterAccount = await redisGetAccountByCurrency(counterCurrency);

  // Construct the result object with defaults
  const exchangeResult = {
    id: nanoid(),
    ts: new Date(),
    ok: false,
    request: exchangeRequest,
    exchangeRate: exchangeRate,
    counterAmount: 0.0,
    obs: null,
  };

  // Check if we have funds on the counter currency account
  if (counterAccount.balance >= counterAmount) {
    // Try to transfer from clients' base account
    if (await transfer(clientBaseAccountId, baseAccount.id, baseAmount)) {
      // Try to transfer to clients' counter account
      if (
        await transfer(counterAccount.id, clientCounterAccountId, counterAmount)
      ) {
        // All good, update balances
        baseAccount.balance += baseAmount;
        counterAccount.balance -= counterAmount;

        await redisUpdateAccount(baseAccount);
        await redisUpdateAccount(counterAccount);

        exchangeResult.ok = true;
        exchangeResult.counterAmount = counterAmount;
      } else {
        // Could not transfer to clients' counter account, return base amount to client
        await transfer(baseAccount.id, clientBaseAccountId, baseAmount);
        exchangeResult.obs = "Could not transfer to clients' account";
      }
    } else {
      // Could not withdraw from clients' account
      exchangeResult.obs = "Could not withdraw from clients' account";
    }
  } else {
    // Not enough funds on internal counter account
    exchangeResult.obs = "Not enough funds on counter currency account";
  }

  // Log the transaction and return it
  await redisSaveLog(exchangeResult);

  return exchangeResult;
}

// Internal - call transfer service to execute transfer between accounts
async function transfer(fromAccountId, toAccountId, amount) {
  const min = 200;
  const max = 400;
  return new Promise((resolve) =>
    setTimeout(() => resolve(true), Math.random() * (max - min + 1) + min)
  );
}