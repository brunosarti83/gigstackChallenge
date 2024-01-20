
export type CustomHeaders = {
    'Content-Type': string;
    'Authorization': string;
}

export type Tax = {
    rate: number,
    inclusive: boolean,
    factor: string,
    withholding: boolean,
    type: string
}

export type Item = {
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

export type invoiceReqType = {
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

export type PaymentItem = {
    name: string,
    description: string,
    price: string,
    qty: number,
    tax_rate: number,
    tax_included: boolean,
    tax_factor: string,
    tax_withholding: boolean,
    tax_type: string,
    category: string,
    sku: string,
    product_key: string,
    unit_code: string,
    unit_key: string,
    unit_name: string
}


export type Payment = {
    line_items: PaymentItem[],
    currency: string,
    customer: {
        name: string,
        email: string,
        phone: string,
        address: {
            street: string,
            city: string,
            state: string,
            country: string,
            zip: string
        }
    },
    payment_method: string,
    status: string,
    notes: string,
    created_at: string,
    accountId: string
}

