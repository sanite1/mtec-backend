import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { connectDb } from "./config/db";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import ApiError from "./errors/apiError";
import userRoutes from "./routes/user.routes";
import onboardingRoutes from "./routes/onboarding.route";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import customersRoutes from "./routes/customer.route";
import storefrontRoutes from "./routes/storefront.routes";
import shippingRoutes from "./routes/shipping.route";
import taxesRoutes from "./routes/taxes.routes";
import locationRoutes from "./routes/location.routes";
import discountRoutes from "./routes/discount.routes";
import storetRoutes from "./routes/store.routes";
import payoutRoutes from "./routes/payoutDetails.route";

const PORT = 4000;

const app = express();

app.use(express.json());

const corsOption = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOption));

/* ✅ IMPORTANT: WAIT FOR DB BEFORE STARTING SERVER */
(async () => {
  await connectDb();

  app.use("/api/users", userRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api/product", productRoutes);
  app.use("/api/order", orderRoutes);
  app.use("/api/customer", customersRoutes);
  app.use("/api/storefront", storefrontRoutes);
  app.use("/api/shipping", shippingRoutes);
  app.use("/api/taxes", taxesRoutes);
  app.use("/api/location", locationRoutes);
  app.use("/api/discount", discountRoutes);
  app.use("/api/store", storetRoutes);
  app.use("/api/payout-details", payoutRoutes);

  app.all("*", (req, _res, next) => {
    next(new ApiError(404, `Can't find ${req.originalUrl} on the server!`));
  });

  app.use(globalErrorHandler);

  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}...`);
  });
})();
