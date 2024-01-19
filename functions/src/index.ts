import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import 'dotenv/config';

import axios from 'axios';

import * as fs from 'fs';
import { promisify } from 'util';


admin.initializeApp({})

admin.firestore().settings({
  host: 'localhost:8080',
  ssl: false
})

const readFileAsync = promisify(fs.readFile)
async function readJsonFile(filePath: string) {
    try {
        const fileContent: string = await readFileAsync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        return jsonData;
    } catch (error) {
        throw error;
    }
}


export const loadingData = functions.https.onRequest(async (request, response) => {
  try {

   const stores = {
    [process.env.ECOM_1_ID || 'store1missing'] : process.env.ECOM_1_KEY,
    [process.env.ECOM_2_ID || 'store2missing'] : process.env.ECOM_2_KEY,
   }

   const collectionRef = admin.firestore().collection('my_collection')


   // Specify the path to your JSON file
   const filePath:string = '../data/payments.json';
   // Load payments
   const payments = await readJsonFile(filePath)
   
   const payment = payments[0]


   // Perform one invoice
   const endpoint = 'https://gigstack-cfdi-bjekv7t4.uc.gateway.dev/v1/invoices/create'
   const storeKey:string|undefined = stores[payment.accountId] 

   type CustomHeaders = {
    'Content-Type': string;
    'Authorization': string;
    }

    const headers: CustomHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storeKey}`,
    }

    type Tax = {
        rate: number,
        inclusive: boolean,
        factor: string,
        withholding: boolean,
        type: string
    }

    type Item = {
        name: string,
        description: string,
        total: number,
        quantity: number,
        taxes: Tax[],
        product_key: string,
        unit_code: string
        unit_key: string,
        unit_name: string
    }

    type invoiceReqType = {
        returnFilesUrls: boolean,
        invoicingIntegration: string,
        use: string,
        payment_form: string,
        type: string,
        relation: string|null,
        emails: string[],
        related: string|null,
        invoiceType: string,
        currency: string,
        exchange_rate?: number,
        export: string|null,
        payment_method: string,
        items: Item[],
        metadata:{
            internalOrderId:string
        },
        client: {
            rfc:string,
            legal_name:string,
            tax_system:{
                label:string,
                value:string
            },
            bcc: string[],
            address: {
                zip: string, 
                country: string
            }
        }
    }

    const invoiceReq:invoiceReqType = {
        returnFilesUrls:false,
        invoicingIntegration:"facturapi",
        use: "S01",
        payment_form: "99",
        type: "create_invoice",
        relation: null,
        emails: ["brunosarti.bs@gmail.com"],
        related: null,
        invoiceType: "I",
        currency: payment.currency.toUpperCase(),

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

    payment.line_items.forEach((item:any) => {
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

    const iKnowItsOk = {
        "returnFilesUrls":false,
        "invoicingIntegration":"facturapi",
        "use": "S01",
        "payment_form": "99",
        "type": "create_invoice",
        "relation": null,
        "emails": ["brunosarti.bs@gmail.com"],
        "related": null,
        "invoiceType": "I",
        "currency": "MXN",
        "export": null,
        "payment_method": "PPD",
        "items": [
                {
                    "name": "Elegant Granite Gloves",
                    "description": "Ergonomic executive chair upholstered in bonded black leather and PVC padded seat and back for all-day comfort and support",
                    "total": 574.00,
                    "quantity": 5,
                    "taxes": [
                        {
                          "rate": 0,
                          "inclusive": true,
                          "factor": "Tasa",
                          "withholding": false,
                          "type": "IVA"
                        }
                      ],
                    "product_key": "01010101",
                    "unit_code": "PZA",
                    "unit_key": "H87",
                    "unit_name": "Pieza"
                },
                {
                    "name": "Incredible Plastic Computer",
                    "description": "The slim & simple Maple Gaming Keyboard from Dev Byte comes with a sleek body and 7- Color RGB LED Back-lighting for smart functionality",
                    "total": 800.00,
                    "quantity": 5,
                    "taxes": [
                        {
                          "rate": 0,
                          "inclusive": true,
                          "factor": "Tasa",
                          "withholding": false,
                          "type": "IVA"
                        }
                      ],
                    "product_key": "01010101",
                    "unit_code": "PZA",
                    "unit_key": "H87",
                    "unit_name": "Pieza"
                }
        ],
        "metadata":{
            "internalOrderId":"brunosarti.bs@gmail.com"
        },
        "client": {
            "rfc":"XAXX010101000",
            "legal_name":"PUBLICO EN GENERAL",
            "tax_system":{
                "label":"Sin obligaciones fiscales",
                "value":"616"
            },
            "bcc": [""],
            "address": {
                "zip": "10200"
                , 
                "country": "MEX"
            }
        }
    }

   const { data } = await axios.post(endpoint, iKnowItsOk, { headers } )

   await collectionRef.add(data) 


   response.send('check firestore!!');

  } catch (error) {
    response.status(500).json({ error })
  } 
});
