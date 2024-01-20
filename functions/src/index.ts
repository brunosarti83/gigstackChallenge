import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import 'dotenv/config';

import axios from 'axios';

import { readJsonFile } from './utils/readJsonFile';
import { getExchange } from './utils/getExchange';
import { CustomHeaders, invoiceReqType, Payment, PaymentItem } from './types'



admin.initializeApp({})

admin.firestore().settings({
  host: 'localhost:8080',
  ssl: false
})

// testing with onRequest, couldn't test Schedule on emulator

export const makeInvoices = functions.https.onRequest(async (request, response) => {
    try {
        
        const storesKeysDict = {
         [process.env.ECOM_1_ID || 'store1missing'] : process.env.ECOM_1_API_KEY,
         [process.env.ECOM_2_ID || 'store2missing'] : process.env.ECOM_2_API_KEY,
        }
        // Specify the path to your JSON file
        const filePath:string = '../data/payments.json';
        // Load payments
        const payments:Payment[] = await readJsonFile(filePath)
        
        // Sort payments
        const payload = {} as any
        const currencies:string[] = []

        payments.forEach((payment) => {
            const store = payment.accountId
            // If there is no index for store create it
            if (!payload[store]) payload[store] = {} as any
            const currency = payment.currency.toUpperCase()
            // If there is no index for currency inside store create it and create first array of items with items in this payment
            if (!payload[store][currency]) {
                payload[store][currency] = [payment.line_items]
                // If currency index exists add items in this line_items as long as it doesn't go over 750
            } else if (payload[store][currency][payload[store][currency].length -1].length + payment.line_items.length <= 750) {
                payload[store][currency][payload[store][currency].length -1].push(...payment.line_items)
                // If adding this one would take it over 750 then create new array of items for next invoice 
            } else {
                payload[store][currency].push(payment.line_items)
            }
            // If this currency is not in array of currencies add it
            if (!currencies.includes(currency)) currencies.push(currency)
        })

        // Make an exchangeRate dict
        const exchangeApiKey = process.env.EXCH_API_KEY as string
        const currencyExchangeRates = await getExchange(exchangeApiKey, currencies)


        // Perform invoices
        const endpoint = 'http://127.0.0.1:5001/gig-test-proj/us-central1/makeInvoice'
        const invoices = []
        for (let store in payload) {
                // set headers for this store
            const storeKey = storesKeysDict[store] as string
            const headers: CustomHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storeKey}`,
            }

            // for each index of currency grouped payments
            for (let currency in payload[store]) {

                // for each group of items grouped in no more than 750
                for (let invoice of payload[store][currency]) {

                    // define base invoice
                    const invoiceReq:invoiceReqType = {
                        returnFilesUrls:false,
                        invoicingIntegration:"facturapi",
                        use: "S01",
                        payment_form: "99",
                        type: "create_invoice",
                        relation: null,
                        emails: [""],
                        related: null,
                        invoiceType: "I",
                        currency: currency,
                        export: null,
                        payment_method: "PPD",
                        items: [],
                        metadata:{
                            internalOrderId:"brunosarti.bs@gmail.com"
                        },
                        client: {
                            rfc:"XAXX010101000",
                            legal_name:"PUBLICO EN GENERAL",
                            tax_system:{
                                label:"Sin obligaciones fiscales",
                                value:"616"
                            },
                            bcc: [""],
                            address: {
                                zip: "10200", 
                                country: "MEX"
                            }
                        }
                    }

                    // for each item in the  invoice group transform and push to invoiceReq.items
                    invoice.forEach((item:PaymentItem) => {
                            invoiceReq.items.push({
                            name: item.name,
                            description: item.description,
                            total: Number(item.price),
                            quantity: Number(item.qty),
                            taxes: [{
                                rate: item.tax_rate,
                                inclusive: item.tax_included,
                                factor: item.tax_factor,
                                withholding: item.tax_withholding,
                                type: item.tax_type
                            }],
                            product_key: item.product_key,
                            unit_code: item.unit_code,
                            unit_key: item.unit_key,
                            unit_name: item.unit_name
                        })
                    })

                    // if currency is not MXN add exchange_rate to invoiceReq
                    if (currency !== 'MXN') {
                        invoiceReq.exchange_rate = currencyExchangeRates[currency]
                    }

                    const body = {
                        store,
                        headers,
                        invoiceReq
                      }

                    //if (invoices.length < 4) { // was testing exact amount that causes timeout
                        const {data} = await (axios.post(endpoint, body))
                        invoices.push(data)
                    //}
                }
            }
        }
        
        const collectionRef = admin.firestore().collection(`Stores`)
        for (let invoiceData of invoices) {
            await collectionRef.add(invoiceData)
        }

        response.send('Invoices created and saved');

  } catch (error) {
    response.status(500).json({ error: error })
  } 
});

export const makeInvoice = functions.https.onRequest(async (request, response) => {
    try {
        const { invoiceReq, headers } = request.body
        const endpoint = 'https://gigstack-cfdi-bjekv7t4.uc.gateway.dev/v1/invoices/create'
        const { data } = await axios.post(endpoint, invoiceReq, { headers } )
        response.json(data)

    } catch (error) {
        response.status(500).json({ errorFrom: error })
    }
})


