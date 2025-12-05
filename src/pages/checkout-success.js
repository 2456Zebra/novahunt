import CheckoutSuccess from '../../src/components/CheckoutSuccess';

/**
 * Page: /checkout-success (src/pages variant)
 * - Shows the success copy without any countdown or auto-redirect.
 * - Keeps the page visible so users can manually sign in.
 */
export default function CheckoutSuccessPage() {
  const message = 'Thanks — your password has been registered.';

  return <CheckoutSuccess message={message} />;
}
