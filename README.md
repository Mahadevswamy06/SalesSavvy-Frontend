# Sales Savvy Frontend

React + Vite frontend for the Sales Savvy Spring Boot API.

## Run locally

1. Install Node.js (LTS).
2. Copy `.env.example` to `.env`.
3. Set `VITE_RAZORPAY_KEY_ID` to the public Razorpay Key ID used by the backend.
4. In this directory run:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:5174`. Run the backend separately on `http://localhost:9090`.

## Deployment

Set `VITE_API_BASE_URL` to the deployed backend API base URL, including `/api`, and set `VITE_RAZORPAY_KEY_ID` to the public Key ID. Rebuild the frontend after changing environment variables.

Anything prefixed with `VITE_` is included in browser code and must be treated as public. Never place database credentials, JWT signing secrets, email passwords, or the Razorpay Key Secret in frontend variables.

## Existing behavior and limitations

- The frontend uses the existing backend routes for cart, orders, and payment.
- Wishlist data is browser-local unless a wishlist API is added.
- Cash on Delivery is not a persistent backend order unless the backend provides an order-creation endpoint for it.
- Product image URLs must resolve to the deployed backend or a valid public image URL.
