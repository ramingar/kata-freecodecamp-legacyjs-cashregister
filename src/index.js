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

const calculateNextChangeCoin = (CURRENCIES, cid, debt) => cid
    // we divide the debt by the coins value to know how many times the coin will be used, if it is greater than 1 we use it
    // we only have to be sure that we don't use more coins than we have, that's why we write the condition in the .map function
    .map(([coin, value]) => ({coin, count: Math.min(+(debt / CURRENCIES[coin]).toFixed(2), +(value / CURRENCIES[coin]).toFixed(2))}))
    .find(({_, count}) => count > 1)

const addNextCoinToTheChange = (CURRENCIES, {debt, cid, coins}) => ({debt, cid, coins, next: calculateNextChangeCoin(CURRENCIES, cid, debt)});

const updateDebt = (CURRENCIES, {debt, cid, coins, next}) => {
    const amountToReturn = CURRENCIES[next?.coin] * Math.floor(next?.count)
    return {
        // If next is undefined, we can't pay the change, the subtraction will be NaN and then debt will be 0 to stop the loop
        debt: debt - amountToReturn || 0,
        // If next is undefined, we can't pay the change, then cid is unaltered.
        // If next is not undefined, cid will be updated only for the coin that will be used (because we used that coin to pay the change)
        cid: cid.map(([coin, amountInCid]) => coin === next?.coin ? [coin, amountInCid - amountToReturn] : [coin, amountInCid]),
        // If next is undefined, we can't pay the change, then coins will be unaltered.
        // If next is not undefined, we add the coin to be used and the amount to be used
        coins: next ? [...coins, [next.coin, amountToReturn]] : coins,
        next
    }
}

const makeChangeCalculation = (CURRENCIES, {debt, cid, coins}) => {

    const nextCoin = addNextCoinToTheChange(CURRENCIES, ({debt, cid, coins}))
    const change   = updateDebt(CURRENCIES, nextCoin);                                                      // updateDebt consists in three steps:
                                                                                                            //      - update debt - the amount left to be paid after paying the coins
                                                                                                            //      - update cid - the list of coins that will remain in your cash register
                                                                                                            //      - update coins - the list of coins used from your cash register

    return change.debt === 0                                                                                // we stop if the debt is 0 (all debt was paid)
        ? change
        : makeChangeCalculation(CURRENCIES, ({debt: change.debt, cid: change.cid, coins: change.coins}))
}

function checkCashRegister(price, cash, cid) {
    const debt    = cash - price;                                                                           // the money to be paid
    const cidDesc = cid.reduce((acc, val) => [val, ...acc], []);                                            // reversed order because we want the change in descending order
    const params  = {debt, cid: cidDesc, coins: []};                                                        // initialize params for makeChangeCalculation

    const change     = makeChangeCalculation(CURRENCIES, params);                                           // calculate the change that will be returned
    const statusTemp = change.coins.length ? 'OPEN' : 'INSUFFICIENT_FUNDS';                                 // if no change, return INSUFFICIENT_FUNDS
    const status     = change.cid.every(([_, amount]) => amount === 0) ? 'CLOSED' : statusTemp;             // if no money left in your cash register after calculating the change, return CLOSED

    const CHANGE_RETURNED = {
        'CLOSED'            : cid,                                                                          // if CLOSED, return cid instead of calculated change (no idea why test cases require this)
        'OPEN'              : change.coins,
        'INSUFFICIENT_FUNDS': change.coins
    }
    const changeInCoins   = CHANGE_RETURNED[status];

    return {status, change: changeInCoins}
}

export {checkCashRegister}