const express = require("express");
const app = express();
const port = 3000; // Set your desired port here

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Server running on port ${port}`));
