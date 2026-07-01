import "dotenv/config";
import app from "./app";
console.log("SERVER FILE FROM SRC IS RUNNING");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CRM Backend running on port ${PORT}`);
});