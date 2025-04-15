import { nanoid } from "nanoid";
import { client } from "./redis.js";

//returns all internal accounts
export async function getAccounts() {
  console.log("Fetching accounts...");
  const keys = await client.keys("account:*");

  const accounts = [];
  for (const key of keys) {
    const data = await client.hGetAll(key);
    accounts.push(data);
  }
  return accounts;
}

//sets balance for an account
export async function setAccountBalance(accountId, balance) {
  if (!accountId || balance === undefined || balance === null) {
    throw new Error("Invalid accountId or balance");
  }

  console.log(
    `Setting account balance with accountId ${accountId} and balance ${balance}`
  );
  let fieldsChanged = await client.hSet(
    "account:" + accountId,
    "balance",
    balance
  );
  console.log("fieldsChanged", fieldsChanged);
}

//returns all current exchange rates
export async function getRates() {
  console.log("Fetching rates...");
  const keys = await client.keys("rate:*");

  const rates = [];
  for (const key of keys) {
    const data = await client.hGetAll(key);
    const rateKey = key.split(":")[1];
    const completeData = {
      [rateKey]: data,
    };
    rates.push(completeData);
  }
  return rates;
}

//returns the whole transaction log
export async function getLog() {
  // compruebo que log sea una clave
  const keys = await client.keys("log");
  if (keys.length === 0) {
    return [];
  }
  return await client.get("log");
}

//sets the exchange rate for a given pair of currencies, and the reciprocal rate as well
export async function setRate(rateRequest) {
  const { baseCurrency, counterCurrency, rate } = rateRequest;

  // rates[baseCurrency][counterCurrency] = rate;
  // rates[counterCurrency][baseCurrency] = Number((1 / rate).toFixed(5));

  let fieldsChanged = await client.hSet(
    "rate:" + baseCurrency,
    counterCurrency,
    rate
  );
  console.log("fieldsChanged", fieldsChanged);
  let fieldsChanged2 = await client.hSet(
    "rate:" + counterCurrency,
    baseCurrency,
    String((1 / Number(rate)).toFixed(5))
  );
  console.log("fieldsChanged2", fieldsChanged2);
}

//executes an exchange operation
export async function exchange(exchangeRequest) {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId: clientBaseAccountId,
    counterAccountId: clientCounterAccountId,
    baseAmount,
  } = exchangeRequest;

  const exchangeRate = await client.hGet(
    "rate:" + baseCurrency,
    counterCurrency
  );
  if (!exchangeRate) {
    return false;
  }
  const counterAmount = Number(baseAmount) * Number(exchangeRate);

  let baseAccount;
  let counterAccount;
  const keys = await client.keys("account:*");
  for (const key of keys) {
    const account = await client.hGetAll(key);
    if (!account) continue;

    if (account.currency === baseCurrency) {
      baseAccount = account; // devuelve el primero que coincida
    }
    if (account.currency === counterCurrency) {
      counterAccount = account; // devuelve el primero que coincida
    }
    if (baseAccount && counterAccount) {
      break; // si ya tenemos ambos, salimos del bucle
    }
  }

  //construct the result object with defaults
  const exchangeResult = {
    id: nanoid(),
    ts: new Date(),
    ok: false,
    request: exchangeRequest,
    exchangeRate: exchangeRate,
    counterAmount: 0.0,
    obs: null,
  };

  if (baseAccount && counterAccount) {
    //check if we have funds on the counter currency account
    if (Number(counterAccount.balance) >= counterAmount) {
      //try to transfer from clients' base account
      if (await transfer(clientBaseAccountId, baseAccount.id, baseAmount)) {
        //try to transfer to clients' counter account
        if (
          await transfer(
            counterAccount.id,
            clientCounterAccountId,
            counterAmount
          )
        ) {
          //all good, update balances
          let fieldsChanged = await client.hSet(
            "account:" + baseAccount.id,
            "balance",
            String(Number(baseAccount.balance) + baseAmount)
          );
          console.log("fieldsChanged", fieldsChanged);
          let fieldsChanged2 = await client.hSet(
            "account:" + counterAccount.id,
            "balance",
            String(Number(counterAccount.balance) - counterAmount)
          );
          console.log("fieldsChanged2", fieldsChanged2);

          exchangeResult.ok = true;
          exchangeResult.counterAmount = counterAmount;
        } else {
          //could not transfer to clients' counter account, return base amount to client
          await transfer(baseAccount.id, clientBaseAccountId, baseAmount);
          exchangeResult.obs = "Could not transfer to clients' account";
        }
      } else {
        //could not withdraw from clients' account
        exchangeResult.obs = "Could not withdraw from clients' account";
      }
    } else {
      //not enough funds on internal counter account
      exchangeResult.obs = "Not enough funds on counter currency account";
    }
  }
  //log the transaction and return it
  await client.lPush("log", JSON.stringify(exchangeResult));
  return exchangeResult;
}

// internal - call transfer service to execute transfer between accounts
/* eslint-disable-next-line no-unused-vars */
async function transfer(_fromAccountId, _toAccountId, _amount) {
  const min = 200;
  const max = 400;
  return new Promise((resolve) =>
    setTimeout(() => resolve(true), Math.random() * (max - min + 1) + min)
  );
}
