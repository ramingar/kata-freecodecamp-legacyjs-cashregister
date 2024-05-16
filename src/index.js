import Decimal from 'decimal';

const CURRENCIES = {
    'PENNY'      : 0.01,
    'NICKEL'     : 0.05,
    'DIME'       : 0.1,
    'QUARTER'    : 0.25,
    'ONE'        : 1,
    'FIVE'       : 5,
    'TEN'        : 10,
    'TWENTY'     : 20,
    'ONE HUNDRED': 100
};

const multiply = (a, b) => parseFloat(Decimal.mul(a, b));
const div      = (a, b) => parseFloat(Decimal.div(a, b));
const minus    = (a, b) => parseFloat(Decimal.sub(a, b));
const Pipe     = (...fns) => arg => fns.reduce((acc, fn) => fn(acc), arg);

const calculateNextChangeCoin = CURRENCIES => (cid, debt) => cid
    // we divide the debt by the coins value to know how many times the coin will be used, if it is greater than 1 we use it
    // we only have to be sure that we don't use more coins than we have, that's why we write the condition in the .map function
    .map(([coin, value]) => ({coin, count: div(value, CURRENCIES[coin]) > div(debt, CURRENCIES[coin]) ? div(debt, CURRENCIES[coin]) : div(value, CURRENCIES[coin])}))
    .find(({coin, count}) => count > 1)

const addNextCoinToTheChange = CURRENCIES => ({debt, cid, coins}) => ({debt, cid, coins, next: calculateNextChangeCoin(CURRENCIES)(cid, debt)});

const updateDebt = CURRENCIES => ({debt, cid, coins, next}) => {
    // If next is undefined, we can't pay the change, then debt is 0 to stop the loop
    return {
        debt: next ? minus(debt, multiply(CURRENCIES[next.coin], Math.floor(next.count))) : 0,
        cid,
        coins,
        next
    }
}
const updateCid  = CURRENCIES => ({debt, cid, coins, next}) => {
    // If next is undefined, we can't pay the change, then cid is unaltered.
    // If next is not undefined, cid will be changed only for the coin that will be used
    return {
        debt,
        cid: next ? cid.map(([coin, amount]) => coin === next.coin ? [coin, minus(amount, multiply(Math.floor(next.count), CURRENCIES[next.coin]))] : [coin, amount]) : cid,
        coins,
        next
    }
}

const updateCoins = CURRENCIES => ({debt, cid, coins, next}) => {
    // If next is undefined, we can't pay the change, then coins will be unaltered.
    // If next is not undefined, we add the coin to be used and the amount to be used
    return {
        debt,
        cid,
        coins: next ? [...coins, [next.coin, multiply(Math.floor(next.count), CURRENCIES[next.coin])]] : coins,
        next
    }
}

const makeChangeCalculation = (CURRENCIES, {debt, cid, coins}) => {

    const change = Pipe(
        addNextCoinToTheChange(CURRENCIES),                                                                 // add a new property 'next' to the object that will contain the next change coin
        updateDebt(CURRENCIES),                                                                             // debt - the amount left to be paid after paying the coins
        updateCid(CURRENCIES),                                                                              // cid - the list of coins that will remain in your cash register
        updateCoins(CURRENCIES)                                                                             // coins - the list of coins used from your cash register
    )({debt, cid, coins});

    return change.debt === 0                                                                                // we stop if the debt is 0 (all debt was paid)
        ? change
        : makeChangeCalculation(CURRENCIES, ({debt: change.debt, cid: change.cid, coins: change.coins}))
}

function checkCashRegister(price, cash, cid) {
    const debt    = minus(cash, price);                                                                     // the money to be paid
    const cidDesc = cid.reduce((acc, val) => [val, ...acc], []);                                            // reversed order because we want the change in descending order
    const params  = {debt, cid: cidDesc, coins: []};                                                        // initialize params for makeChangeCalculation

    const changeTemp = makeChangeCalculation(CURRENCIES, params);                                           // calculate the change that will be returned
    const statusTemp = changeTemp.coins.length > 0 ? 'OPEN' : 'INSUFFICIENT_FUNDS';                         // if no change, return INSUFFICIENT_FUNDS
    const status     = changeTemp.cid.every(([coin, amount]) => amount === 0) ? 'CLOSED' : statusTemp;      // if no money left in your cash register after calculating the change, return CLOSED
    const change     = status === 'CLOSED' ? {coins: cid} : changeTemp;                                     // if CLOSED, return cid instead of change (no idea why test cases require this)

    return {status, change: change.coins}
}

export {checkCashRegister}