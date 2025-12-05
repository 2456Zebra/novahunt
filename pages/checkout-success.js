import { useRouter } from 'next/router';
import CheckoutSuccess from '../components/CheckoutSuccess';

/**
 * Page: /checkout-success
 * - Shows the success copy without any countdown or auto-redirect.
 * - Keeps the page visible so users can manually sign in.
 *
 * If your code previously relied on a query param to show different copy,
 * the message is kept intentionally simple and static (new copy).
 */
export default function CheckoutSuccessPage() {
  const router = useRouter();
  // If you rely on router.query to show dynamic content you can read it here.
  // const { email } = router.query;

  const message = 'Thanks — your password has been registered.';

  return <CheckoutSuccess message={message} />;
}
