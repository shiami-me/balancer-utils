import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import JSONbig from "json-bigint";
import swapRoutes from "./routes/swap";
import queryRoutes from "./routes/queries";
import addLiquidityRoutes from "./routes/addLiquidity";
import removeLiquidityRoutes from "./routes/removeLiquidity";

// Load environment variables
dotenv.config();
JSON.parse = JSONbig.parse;
JSON.stringify = JSONbig.stringify;
const app = express();
const port = process.env.PORT || 3000;

// Recursive function to convert `rawAmount` to BigInt in any nested object
const convertRawAmountToBigInt = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertRawAmountToBigInt);
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        key === "rawAmount" && typeof value === "string"
          ? BigInt(value)
          : convertRawAmountToBigInt(value),
      ])
    );
  }
  return obj;
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use((req, res, next) => {
  try {
    if (req.body) {
      req.body = { ...convertRawAmountToBigInt(req.body) };
    }
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid rawAmount format" });
  }
});

// API Routes
app.use("/api/swap", swapRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/add-liquidity", addLiquidityRoutes);
app.use("/api/remove-liquidity", removeLiquidityRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
