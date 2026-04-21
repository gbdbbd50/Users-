
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  increment, 
  addDoc 
} from 'firebase/firestore';

/**
 * @fileOverview Xixapay Webhook Handler
 * This endpoint receives notifications from Xixapay when a payment is made.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { firestore: db } = initializeFirebase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    if (payload.status === 'success' || payload.event === 'transaction.success') {
      const data = payload.data || payload;
      const amount = parseFloat(data.amount);
      const email = data.customer?.email;
      const reference = data.reference || data.id;

      if (!email || isNaN(amount)) {
        return NextResponse.json({ error: 'Incomplete payload' }, { status: 400 });
      }

      // 1. Find the user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error(`Webhook Error: User with email ${email} not found.`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const profile = userDoc.data();

      // 2. Check if this transaction was already processed
      const depositsRef = collection(db, 'deposits');
      const dupQuery = query(depositsRef, where('reference', '==', reference));
      const dupSnapshot = await getDocs(dupQuery);

      if (!dupSnapshot.empty) {
        return NextResponse.json({ message: 'Already processed' }, { status: 200 });
      }

      // 3. Update user balance and log deposit
      await updateDoc(doc(db, 'users', userId), {
        balance: increment(amount),
        depositCount: increment(1),
        status: 'VERIFIED'
      });

      // 4. Award Referral Commission for Advertiser Deposit
      if (profile.referredBy) {
        const inviterQuery = query(collection(db, "users"), where("referralCode", "==", profile.referredBy));
        const inviterSnap = await getDocs(inviterQuery);
        
        if (!inviterSnap.empty) {
          const inviterDoc = inviterSnap.docs[0];
          const inviterData = inviterDoc.data();
          const commissionPercentage = inviterData.advertiserCommissionPercentage || 0;
          const commissionAmount = amount * (commissionPercentage / 100);

          if (commissionAmount > 0) {
            await updateDoc(inviterDoc.ref, {
              balance: increment(commissionAmount)
            });

            await addDoc(collection(db, "notifications"), {
              userId: inviterDoc.id,
              title: "Referral Commission Received!",
              message: `Your referral ${profile.displayName} deposited ₦${amount.toLocaleString()}. You earned ₦${commissionAmount.toLocaleString()} (${commissionPercentage}% commission).`,
              type: 'DEPOSIT',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      await addDoc(collection(db, 'deposits'), {
        userId,
        amount,
        method: 'XIXAPAY_VA',
        reference,
        status: 'APPROVED',
        type: 'DEPOSIT',
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'notifications'), {
        userId,
        title: 'Wallet Credited',
        message: `Your account was successfully credited with ₦${amount.toLocaleString()} via bank transfer.`,
        type: 'DEPOSIT',
        read: false,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('Xixapay Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
