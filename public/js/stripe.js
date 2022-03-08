import axios from "axios";
import { showAlert } from "./alerts";

/* eslint-disable */
const stripe = Stripe(
  "pk_test_51JKIAWG6RJPkyqnOaXtgS8WmVqCiXMK4LX4qiV8VD6CygbMR3qaeQcwuVJxT0AeOhVCJpGgbzQENHfz8GSfHrE0S00Kzs8vPFc"
);
export const bookTour = async (tourId) => {
  try {
    //1) get Checkout session from api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //2) Create checkout from + charge  credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert("error", err.message);
  }
};
