const express = require("express");
const app = express();

app.use((req, res, next) => {
  console.log("new request oo");
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/api/v1/service2", function (req, res) {
  res.json({ message: "Hello from service 2" });
});

app.listen(3000, function () {
  console.log("Service 2 is running on port 3000");
});
