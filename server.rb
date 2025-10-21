require 'stripe'
require 'sinatra'

# Replace with your new Stripe secret key
Stripe.api_key = 'YOUR_NEW_SK_TEST_KEY_HERE'
set :port, 4242

post '/create-checkout-session' do
  content_type :json
  lookup_key = params['lookup_key']
  prices = Stripe::Price.list(lookup_keys: [lookup_key], expand: ['data.product'])

  unless prices.data[0]
    halt 400, { error: { message: 'Invalid plan selected' } }.to_json
  end

  session = Stripe::Checkout::Session.create({
    mode: 'subscription',
    line_items: [{
      price: prices.data[0].id,
      quantity: 1,
    }],
    success_url: 'http://localhost:4242/dashboard.html?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'http://localhost:4242/cancel.html',
  })

  { id: session.id }.to_json
end

# Optional: Add a simple health check
get '/' do
  'Server is running'
end