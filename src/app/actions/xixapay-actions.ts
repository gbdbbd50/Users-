'use server';

/**
 * @fileOverview Secure server-side actions for Xixapay integration.
 * This implementation uses the Secret Key and Business ID provided.
 */

import { paymentKeys } from "@/firebase/config";

export async function generateXixapayVirtualAccount(amount: number, customer: { email: string, name: string }) {
  const { secretKey, businessId } = paymentKeys.xixapay;
  
  if (!secretKey || secretKey === '') {
    return { success: false, message: "Xixapay Secret Key is missing in configuration." };
  }

  try {
    // Calling the Xixapay V2 API endpoint for virtual account creation
    // We include the business_id as required by the merchant identification logic
    const response = await fetch('https://api.xixapay.com/v1/virtual-account/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        customer_name: customer.name,
        customer_email: customer.email,
        amount: amount > 0 ? amount : 0,
        merchant_ref: `TH-VA-${Date.now()}`
      })
    });

    const result = await response.json();

    if (response.ok && (result.status === 'success' || result.success === true)) {
      const accountData = result.data;
      return {
        success: true,
        data: {
          bankName: accountData.bank_name || accountData.bankName || "Wema Bank",
          accountNumber: accountData.account_number || accountData.accountNumber,
          accountName: accountData.account_name || accountData.accountName,
          expiresIn: "Permanent",
          amount: amount
        }
      };
    } else {
      console.error("Xixapay API Failure:", result);
      return { 
        success: false, 
        message: result.message || result.error || `API Error: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error: any) {
    console.error("Xixapay Network Error:", error);
    return { success: false, message: "Could not connect to Xixapay. Please check your internet or IP whitelist settings." };
  }
}
