import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

import { errorHandler, routeNotFound } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import dbConnection from "./utils/connectDB.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();
dbConnection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5000;

const app = express();
app.use(
  cors({
    origin: ["https://mcav-administrador-tareas.netlify.app", "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api", routes);
app.use('/api/upload', (req, res, next) => {
  console.log('Llega a /api/upload');
  next();
});
app.use('/api/upload', uploadRoutes);

app.use(routeNotFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server listening on ${port}`));
