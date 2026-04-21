
'use server';

/**
 * Server action to initiate a Paystack transfer (payout).
 * This keeps the Secret Key secure on the server side.
 */

export async function initiatePaystackTransfer(amount: number, bankAccount: { accountName: string, accountNumber: string, bankCode: string }) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  
  if (!secretKey || secretKey === 'sk_live_replace_this_with_your_actual_secret_key') {
    return { 
      success: false, 
      message: "Server configuration incomplete. Please provide a valid PAYSTACK_SECRET_KEY in the .env file." 
    };
  }

  try {
    // 1. Create a Transfer Recipient
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: "nuban",
        name: bankAccount.accountName,
        account_number: bankAccount.accountNumber,
        bank_code: bankAccount.bankCode,
        currency: "NGN"
      })
    });

    const recipientData = await recipientResponse.json();

    if (!recipientData.status) {
      throw new Error(`Recipient creation failed: ${recipientData.message}`);
    }

    const recipientCode = recipientData.data.recipient_code;

    // 2. Initiate the Transfer
    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(amount * 100), // convert Naira to Kobo
        recipient: recipientCode,
        reason: "TaskHome Earner Withdrawal"
      })
    });

    const transferData = await transferResponse.json();

    return {
      success: transferData.status,
      message: transferData.message,
      data: transferData.data
    };

  } catch (error: any) {
    console.error('Paystack Payout Error:', error);
    return { 
      success: false, 
      message: error.message || "An unexpected error occurred during the payout process." 
    };
  }
}
