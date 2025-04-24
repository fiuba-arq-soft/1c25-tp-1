import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

let accounts = null;
let rates = null;
let log = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCOUNTS = "./state/accounts.json";
const RATES = "./state/rates.json";
const LOG = "./state/log.json";

export async function init() {
  accounts = await load(ACCOUNTS);
  rates = await load(RATES);
  log = await load(LOG);

  scheduleSave(accounts, ACCOUNTS, 1000);
  scheduleSave(rates, RATES, 5000);
  scheduleSave(log, LOG, 1000);
}

export function getAccounts() {
  return accounts;
}

export function getRates() {
  return rates;
}

export function getLog() {
  return log;
}

async function load(fileName) {
  const filePath = path.join(__dirname, fileName);

  try {
    await fs.promises.access(filePath);
    const raw = await fs.promises.readFile(filePath, "utf8");
    
    return JSON.parse(raw);
  } catch (err) {
    if (err.code == "ENOENT") {
      console.error(`${filePath} not found`);
    } else {
      console.error(`Error loading ${filePath}:`, err);
    }
  }
}

async function save(data, fileName) {
  const filePath = path.join(__dirname, fileName);
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

function scheduleSave(data, fileName, period) {
  setInterval(async () => {
    await save(data, fileName);
  }, period);
}
