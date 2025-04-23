function checkRequiredFields(fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) {
        return `Missing field: ${key}`;
      }
    }
  
    return null;
}
  
function validateCorrectCurrencyFormats(currencies) {
    for (const [key, value] of Object.entries(currencies)) {
      if (typeof value !== "string" || value.length !== 3) {
        return `Invalid ${key}: must be a 3-character string`;
      }
    }
  
    return null;
}
  
function validatePositiveIntegerFields(fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (!Number.isInteger(value) || value <= 0) {
        return `Invalid ${key}. Must be a positive integer.`;
      }
    }
  
    return null;
}
  
function validatePositiveNumberFields(fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value !== "number" || value <= 0) {
        return `Invalid ${key}. Must be a positive number.`;
      }
    }
    return null;
}

function validateCurrency(currency) {
    if (typeof currency !== "string" || currency.length !== 3) {
      return `Invalid currency: must be a 3-character string`;
    }

    const validCurrencies = ["USD", "EUR", "BRL", "ARS"];
    if (!validCurrencies.includes(currency)) {
      return `Invalid currency: ${currency}. Must be one of ${validCurrencies.join(", ")}`;
    }

    return null;
}

export function evaluateFieldsForAccount(accountId, currency, balance) {
    const missingFieldError = checkRequiredFields({ accountId, currency, balance });
    if (missingFieldError) {
      return missingFieldError;
    }

    const parsedAccountId = parseInt(accountId, 10);
    const invalidAccountIdError = validatePositiveIntegerFields({ parsedAccountId });
    if (invalidAccountIdError) {
      return invalidAccountIdError;
    }

    const invalidBalanceError = validatePositiveNumberFields({ balance });
    if (invalidBalanceError) {
      return invalidBalanceError;
    }

    const invalidCurrencyError = validateCurrency(currency);
    if (invalidCurrencyError) {
        return invalidCurrencyError;
    }

    return null;
}

export function evaluateFieldsForTransfer(fromAccountId, toAccountId, amount) {
  const missingFieldError = checkRequiredFields({ fromAccountId, toAccountId, amount });
  if (missingFieldError) {
    return missingFieldError;
  }

  const invalidAccountIdsError = validatePositiveIntegerFields({ fromAccountId, toAccountId });
  if (invalidAccountIdsError) {
    return invalidAccountIdsError;
  }

  const invalidAmountError = validatePositiveNumberFields({ amount });
  if (invalidAmountError) {
    return invalidAmountError;
  }

  return null;
}
  
export function evaluateFieldsForSetBalance(accountId, balance) {
    const missingFieldError = checkRequiredFields({ balance });
    if (missingFieldError) {
      return missingFieldError;
    }
  
    const parsedAccountId = parseInt(accountId, 10);
    const invalidAccountIdError = validatePositiveIntegerFields({ parsedAccountId });
    if (invalidAccountIdError) {
      return invalidAccountIdError;
    }
  
    const invalidBalanceError = validatePositiveNumberFields({ balance });
    if (invalidBalanceError) {
      return invalidBalanceError;
    }
  
    return null;
}
  
export function evaluateFieldsForRate(baseCurrency, counterCurrency, rate) {
    const missingFieldError = checkRequiredFields({ baseCurrency, counterCurrency, rate });
    if (missingFieldError) {
      return missingFieldError;
    }
  
    const invalidCurrencyFormatError = validateCorrectCurrencyFormats({ baseCurrency, counterCurrency });
    if (invalidCurrencyFormatError) {
      return invalidCurrencyFormatError;
    }
  
    const invalidRateError = validatePositiveIntegerFields({ rate });
    if (invalidRateError) {
      return invalidRateError;
    }
  
    return null;
}
  
export function evaluateFieldsForExchange(baseCurrency, counterCurrency, baseAccountId, counterAccountId, baseAmount) {
    const missingFieldError = checkRequiredFields({ baseCurrency, counterCurrency, baseAccountId, counterAccountId, baseAmount });
    if (missingFieldError) {
      return missingFieldError;
    }
  
    const invalidCurrencyFormatError = validateCorrectCurrencyFormats({ baseCurrency, counterCurrency });
    if (invalidCurrencyFormatError) {
      return invalidCurrencyFormatError;
    }
  
    const invalidAccountsIdError = validatePositiveIntegerFields({ baseAccountId, counterAccountId });
    if (invalidAccountsIdError) {
      return invalidAccountsIdError;
    }
  
    const invalidAmountError = validatePositiveNumberFields({ baseAmount });
    if (invalidAmountError) {
      return invalidAmountError;
    }
  
    return null;
}