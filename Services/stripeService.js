const config = require('../config');
const auth = require('../middleware/auth');

const stripe = require('stripe')(config.StripePublishableKey);

const paymentSheet = async (req, res) => {
  console.log('Payment sheet called');
  const {email} = req.body; // Destructure to get the email from req.body

  let {username, fullname, stripeUserId} = await auth.getUserStripeDetails(
    email,
  );

  if (stripeUserId == null || stripeUserId == '') {
    console.log('Stripe ID not found, creating a new customer');
    const customer = await stripe.customers.create({
      name: fullname,
      email: email,
    });
    stripeUserId = customer.id;
    await auth.setUserStripeId(email, stripeUserId); // Save the customer ID with the email
  }

  // Create ephemeral key and setup intent
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: stripeUserId},
    {apiVersion: '2024-06-20'},
  );
  const setupIntent = await stripe.setupIntents.create({
    customer: stripeUserId,
    automatic_payment_methods: {enabled: true},
  });

  res.json({
    setupIntent: setupIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: stripeUserId,
    publishableKey: config.StripePublishableKey,
  });
};

const checkStripePaymentandAddressPresent = async (req, res) => {
  console.log('Checking payment and address present');
  const {email} = req.body;
  console.log('Email:', email);

  let {username, fullname, stripeUserId} = await auth.getUserStripeDetails(
    email,
  );

  if (stripeUserId == null || stripeUserId == '') {
    return res.json({paymentPresent: false, address: null});
  }

  try {
    const customer = await stripe.customers.retrieve(stripeUserId);

    console.log('Stripe ID:', stripeUserId);
    console.log('Customer:', customer.id);
    const paymentMethods = await stripe.customers.listPaymentMethods(
      stripeUserId,
      {
        limit: 3,
      },
    );

    if (paymentMethods.data.length == 0) {
      return res.json({paymentPresent: false, address: customer.address});
    } else {
      return res.json({paymentPresent: true, address: customer.address});
    }
  } catch (error) {
    console.error('In catch block for payment and address present:');
    return res.json({paymentPresent: false, address: null});
  }
};

const updateStripeCustomerAddress = async (req, res) => {
  const {email, address} = req.body;
  try {
    let {username, fullname, stripeUserId} = await auth.getUserStripeDetails(
      email,
    );

    // Update customer address on Stripe
    const updatedCustomer = await stripe.customers.update(stripeUserId, {
      address: {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      },
    });

    res.json({success: true, customer: updatedCustomer});
  } catch (error) {
    console.error('Error updating customer address:', error);
    res
      .status(500)
      .json({success: false, error: 'Failed to update customer address'});
  }
};

const createStripeConnectedAccount = async (req, res) => {
  const {email, address} = req.body;
  try {
    let {username, fullname, stripeUserId} = await auth.getUserStripeDetails(
      email,
    );

    const account = await stripe.accounts.create({
      controller: {
        losses: {
          payments: 'application',
        },
        fees: {
          payer: 'application',
        },
        stripe_dashboard: {
          type: 'express',
        },
      },
      business_profile: {
        url: 'https://hayersimrat23.wixsite.com/getpanda',
        mcc: '5734',
        product_description: 'Test product description',
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url:
        config.SERVER_URL + '/api/auth/createStripeConnectedAccountRefreshURL',
      return_url:
        config.SERVER_URL + '/api/auth/createStripeConnectedAccountReturnURL',
      type: 'account_onboarding',
      collection_options: {
        fields: 'eventually_due',
      },
    });

    await auth.setUserStripeConnectedAccountId(email, account.id);

    res.json({
      success: true,
      accountId: account.id,
      accountLink: accountLink,
    });
  } catch (error) {
    console.error('Error updating customer address:', error);
    res
      .status(500)
      .json({success: false, error: 'Failed to update customer address'});
  }
};

const createStripeConnectedAccountReturnURL = async (req, res) => {
  console.log('Return URL called');
  console.log(req.body);
  res.json({message: 'Return URL called'});
};

const createStripeConnectedAccountRefreshURL = async (req, res) => {
  console.log('Refresh URL called');
  console.log(req.body);
  //const {email, address} = req.body;
  try {
    const account = await stripe.accounts.create({
      controller: {
        losses: {
          payments: 'application',
        },
        fees: {
          payer: 'application',
        },
        stripe_dashboard: {
          type: 'express',
        },
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url:
        config.SERVER_URL + '/api/auth/createStripeConnectedAccountRefreshURL',
      return_url:
        config.SERVER_URL + '/api/auth/createStripeConnectedAccountReturnURL',
      type: 'account_onboarding',
      collection_options: {
        fields: 'eventually_due',
      },
    });

    await auth.setUserStripeConnectedAccountId(email, account.id);

    res.redirect(accountLink.url);
  } catch (error) {
    console.error('Error updating customer address:', error);
    res
      .status(500)
      .json({success: false, error: 'Failed to update customer address'});
  }
};

const checkStripeConnectedAccountOnboardingComplete = async (req, res) => {
  const {email} = req.body;
  try {
    const {stripeConnectedAccountId} = await auth.getUserStripeDetails(email);
    console.log('Account ID:', stripeConnectedAccountId);
    if (stripeConnectedAccountId == null || stripeConnectedAccountId == '') {
      return res.json({success: false, accountId: stripeConnectedAccountId});
    }
    const account = await stripe.accounts.retrieve(stripeConnectedAccountId);

    if (
      account.requirements.currently_due == null ||
      account.requirements.currently_due.length == 0
    ) {
      res.json({success: true, accountId: stripeConnectedAccountId});
    } else {
      res.json({success: false, accountId: stripeConnectedAccountId});
    }
  } catch (error) {
    console.error('Error checking account onboarding status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check account onboarding status',
    });
  }
};

const createStripeLoginLink = async (req, res) => {
  const {email} = req.body;
  try {
    const {stripeConnectedAccountId} = await auth.getUserStripeDetails(email);
    console.log('Account ID:', stripeConnectedAccountId);
    if (stripeConnectedAccountId == null || stripeConnectedAccountId == '') {
      return res.json({success: false, accountId: stripeConnectedAccountId});
    }
    const loginLink = await stripe.accounts.createLoginLink(
      stripeConnectedAccountId,
    );
    res.json({success: true, loginLink: loginLink});
  } catch (error) {
    console.error('Error creating login link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create login link',
    });
  }
};

const continueOnboarding = async (req, res) => {
  const {email} = req.body;
  try {
    const {stripeConnectedAccountId} = await auth.getUserStripeDetails(email);
    console.log('Account ID:', stripeConnectedAccountId);
    if (stripeConnectedAccountId == null || stripeConnectedAccountId == '') {
      return res.json({success: false, accountId: stripeConnectedAccountId});
    }

    try {
      const loginLink = await stripe.accounts.createLoginLink(
        stripeConnectedAccountId,
      );

      res.json({
        success: true,
        accountId: stripeConnectedAccountId,
        loginLink: loginLink,
      });
    } catch (error) {
      console.error('Error creating login link:, Starting new onboarding');
      const account = await stripe.accounts.create({
        controller: {
          losses: {
            payments: 'application',
          },
          fees: {
            payer: 'application',
          },
          stripe_dashboard: {
            type: 'express',
          },
        },
        business_profile: {
          url: 'https://hayersimrat23.wixsite.com/getpanda',
          mcc: '5734',
          product_description: 'Test product description',
        },
      });

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url:
          config.SERVER_URL +
          '/api/auth/createStripeConnectedAccountRefreshURL',
        return_url:
          config.SERVER_URL + '/api/auth/createStripeConnectedAccountReturnURL',
        type: 'account_onboarding',
        collection_options: {
          fields: 'eventually_due',
        },
      });

      await auth.setUserStripeConnectedAccountId(email, account.id);

      res.json({
        success: true,
        accountId: account.id,
        loginLink: accountLink,
      });
    }
  } catch (error) {
    console.error('Error creating login link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create login link',
    });
  }
};

const chargeCustomerOffSession = async ({
  id,
  amount,
  userUsername,
  broadcasterUsername,
}) => {
  try {
    console.log('amount:', amount);
    // Assuming auth.getUserStripeDetails() requires the username instead of email
    const {email} = await auth.getUserDetailsFromUsername(userUsername);
    const {stripeUserId} = await auth.getUserStripeDetails(email);
    console.log('Account ID:', stripeUserId);

    if (!stripeUserId) {
      return {success: false, error: 'Stripe user ID not found'};
    }

    const paymentMethods = await stripe.customers.listPaymentMethods(
      stripeUserId,
      {
        limit: 3,
      },
    );

    if (paymentMethods.length === 0) {
      return {success: false, error: 'No payment methods available'};
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'cad',
      customer: stripeUserId,
      payment_method: paymentMethods.data[0].id,
      return_url: 'http://localhost:3000/api/auth/webhook',
      off_session: true,
      confirm: true,
    });

    console.log('PaymentIntent created:', paymentIntent.id);
    return {success: true, paymentIntentId: paymentIntent.id};
  } catch (error) {
    console.error('Error charging customer:', error);
    return {success: false, error: 'Failed to charge customer'};
  }
};

const chargeCustomerOffSessionForAccount = async ({
  id,
  amount,
  userUsername,
  broadcasterUsername,
}) => {
  try {
    console.log('amount:', amount);
    // Assuming auth.getUserStripeDetails() requires the username instead of email
    const {email} = await auth.getUserDetailsFromUsername(userUsername);
    const {stripeUserId} = await auth.getUserStripeDetails(email);
    console.log('Account ID:', stripeUserId);

    const {email: sellerEmail} = await auth.getUserDetailsFromUsername(
      broadcasterUsername,
    );
    const {stripeConnectedAccountId} = await auth.getUserStripeDetails(
      sellerEmail,
    );

    if (!stripeUserId) {
      return {success: false, error: 'Stripe user ID not found'};
    }

    const paymentMethods = await stripe.customers.listPaymentMethods(
      stripeUserId,
      {
        limit: 3,
      },
    );

    if (paymentMethods.length === 0) {
      return {success: false, error: 'No payment methods available'};
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'cad',
      customer: stripeUserId,
      payment_method: paymentMethods.data[0].id,
      return_url: 'http://localhost:3000/api/auth/webhook',
      off_session: true,
      confirm: true,
      application_fee_amount: Math.round(amountInCents * config.COMMISIONRATE),
      transfer_data: {
        destination: stripeConnectedAccountId,
      },
    });

    console.log('PaymentIntent created:', paymentIntent.id);
    return {success: true, paymentIntentId: paymentIntent.id};
  } catch (error) {
    console.error('Error charging customer:', error);
    return {success: false, error: 'Failed to charge customer'};
  }
};

const stripeWebhooks = async (req, res) => {
  console.log('Webhook called');
  let event = req.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  // if (endpointSecret) {
  //   // Get the signature sent by Stripe
  //   const signature = req.headers['stripe-signature'];
  //   try {
  //     event = stripe.webhooks.constructEvent(
  //       req.body,
  //       signature,
  //       endpointSecret,
  //     );
  //   } catch (err) {
  //     console.log(`⚠️  Webhook signature verification failed.`, err.message);
  //     return res.sendStatus(400);
  //   }
  // }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;

    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

module.exports = {
  paymentSheet,
  checkStripePaymentandAddressPresent,
  updateStripeCustomerAddress,
  createStripeConnectedAccount,
  createStripeConnectedAccountReturnURL,
  createStripeConnectedAccountRefreshURL,
  checkStripeConnectedAccountOnboardingComplete,
  createStripeLoginLink,
  continueOnboarding,
  chargeCustomerOffSession,
  chargeCustomerOffSessionForAccount,
  stripeWebhooks,
};
