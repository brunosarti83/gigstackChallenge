
import axios from 'axios';

export const getExchange = async (key:string, currencies:string[]) => {
    const currencyExchangeRates = {} as any
    for (let i=0; i<currencies.length; i++) {
        const currency = currencies[i]
        if (currency !== 'MXN') {
            const url = `https://v6.exchangerate-api.com/v6/${key}/latest/${currency}`  
            const { data } = await axios.get(url)
            currencyExchangeRates[currency] = data.conversion_rates.MXN
        } 
    }
    
    return currencyExchangeRates
}
