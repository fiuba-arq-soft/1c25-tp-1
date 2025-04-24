// filepath: d:\Source\UBA\75.73\arq-soft-1c2025-tp-1-Architecture-Summit\app\state-redis.js
import { createClient } from 'redis';

// Configure Redis connection with host and port
const client = createClient({
    url: "redis://redis:6379"
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

await client.connect();

// Get all accounts
export async function getAccounts() {
    try {
        const keys = await client.keys('accounts:*');
        const accounts = await Promise.all(keys.map(key => client.get(key).then(JSON.parse)));
        return accounts;
    } catch (err) {
        console.error('Error fetching accounts from Redis:', err);
        return null;
    }
}

// Get an account by its ID
export async function getAccountById(id) {
    try {
      const account = await client.get(`accounts:${id}`);
      return account ? JSON.parse(account) : null;
    } catch (err) {
      console.error('Error fetching account by ID from Redis:', err);
      return null;
    }
}

// Get an account by its currency
export async function getAccountByCurrency(currency) {
    try {
      const keys = await client.keys('accounts:*');
      for (const key of keys) {
        const account = JSON.parse(await client.get(key));
        if (account.currency === currency) {
          return account;
        }
      }
      return null;
    } catch (err) {
      console.error('Error fetching account by currency from Redis:', err);
      return null;
    }
}

// Create an account
export async function createAccount(newAccount) {
    try {
      await client.set(`accounts:${newAccount.id}`, JSON.stringify(newAccount));
    } catch (err) {
      console.error('Error creating account in Redis:', err);
    }
}

// Update an account
export async function updateAccount(updatedAccount) {
    try {
      await client.set(`accounts:${updatedAccount.id}`, JSON.stringify(updatedAccount));
    } catch (err) {
      console.error('Error updating account in Redis:', err);
    }
}

// Get all rates
export async function getRates() {
    try {
      const keys = await client.keys('rates:*');
      const rates = await Promise.all(keys.map(key => client.get(key).then(JSON.parse)));
      return rates;
    } catch (err) {
      console.error('Error fetching rates from Redis:', err);
      return null;
    }
}

// Get a rate by baseCurrency and counterCurrency
export async function getRate(baseCurrency, counterCurrency) {
    try {
      const rate = await client.get(`rates:${baseCurrency}:${counterCurrency}`);
      return rate ? JSON.parse(rate) : null;
    } catch (err) {
      console.error('Error fetching rate from Redis:', err);
      return null;
    }
}

// Create a new rate
export async function createRate(newRate) {
    try {
      const { baseCurrency, counterCurrency, rate } = newRate;
      await client.set(`rates:${baseCurrency}:${counterCurrency}`, JSON.stringify({ baseCurrency, counterCurrency, rate }));
      // Also store the reciprocal rate
      await client.set(`rates:${counterCurrency}:${baseCurrency}`, JSON.stringify({ baseCurrency: counterCurrency, counterCurrency: baseCurrency, rate: 1 / rate }));
    } catch (err) {
      console.error('Error creating rate in Redis:', err);
    }
}
  
// Update a rate
export async function updateRate(updatedRate) {
    try {
      const { baseCurrency, counterCurrency, rate } = updatedRate;
      await client.set(`rates:${baseCurrency}:${counterCurrency}`, JSON.stringify({ baseCurrency, counterCurrency, rate }));
      // Also store the reciprocal rate
      await client.set(`rates:${counterCurrency}:${baseCurrency}`, JSON.stringify({ baseCurrency: counterCurrency, counterCurrency: baseCurrency, rate: 1 / rate }));
    } catch (err) {
      console.error('Error updating rate in Redis:', err);
    }
}


// Get all logs
export async function getLog() {
    try {
      const keys = await client.keys('log:*');
      const logs = await Promise.all(keys.map(key => client.get(key).then(JSON.parse)));
      return logs;
    } catch (err) {
      console.error('Error fetching logs from Redis:', err);
      return null;
    }
}
  
// Save a new log
export async function saveLog(newLog) {
    try {
      const logId = `log:${newLog.id}`;
      await client.set(logId, JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving log to Redis:', err);
    }
}