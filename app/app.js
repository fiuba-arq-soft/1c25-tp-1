import express from "express";
import v1Router from "./routers/v1Router.js";
import v11Router from "./routers/v11Router.js";
import v2Router from "./routers/v2Router.js";

const app = express();
const port = 3000;

app.use(express.json());

// Register routes
app.use('/', v1Router); // default route for original v1Router
app.use('/v1', v1Router); // original v1Router
app.use('/v1.1', v11Router); // original + validations Router
app.use('/v2', v2Router); // redis implementation Router

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
