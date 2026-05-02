const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");

const app = express();
const PORT = process.env.PORT ||

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "freemanson_secret",
    resave: false,
    saveUninitialized: true
  })
);

// DATABASE
const db = new sqlite3.Database("database.db");

// CLIENT TABLE
db.run(`
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  account TEXT,
  phone TEXT,
  image TEXT
)
`);

// PAYMENTS TABLE
db.run(`
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  phone TEXT,
  amount REAL,
  status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// ---------------- HOME ----------------
app.get("/", (req, res) => {
  res.send(`
  <style>
    body { background: linear-gradient(to right, #000, #3b0000); color: white; text-align: center; font-family: Arial; }
    a { color: gold; font-size: 20px; text-decoration: none; }
  </style>

  <h1>🔥 FREEMANSON666 SYSTEM</h1>
  <a href="/login">Admin Login</a>
  `);
});

// ---------------- LOGIN ----------------
app.get("/login", (req, res) => {
  res.send(`
  <style>
    body { background: black; color: white; text-align: center; }
    input, button { padding: 10px; margin: 5px; }
  </style>

  <h2>Admin Login</h2>
  <form method="POST">
    <input name="username" placeholder="Username" required />
    <button>Login</button>
  </form>
  `);
});

app.post("/login", (req, res) => {
  req.session.admin = req.body.username;
  res.redirect("/dashboard");
});

// ---------------- DASHBOARD ----------------
app.get("/dashboard", (req, res) => {
  if (!req.session.admin) return res.send("Login required");

  db.all("SELECT * FROM clients", (err, rows) => {
    let list = rows.map(c => `
      <li style="margin:10px;">
        ${c.name} |
        <a href="/client/${c.id}" style="color:lightgreen;">View</a> |
        <a href="/pay/${c.id}" style="color:gold;">Pay Link</a>
      </li>
    `).join("");

    res.send(`
    <style>
      body { background: #111; color: white; font-family: Arial; text-align:center; }
      a { color: gold; }
    </style>

    <h2>Admin Dashboard</h2>
    <a href="/register">➕ Register Client</a>
    <ul>${list}</ul>
    `);
  });
});

// ---------------- REGISTER CLIENT ----------------
app.get("/register", (req, res) => {
  res.send(`
  <style>
    body { background: linear-gradient(to right, #1a0000, #000); color: white; text-align: center; }
    input, button { padding: 10px; margin: 5px; width: 200px; }
  </style>

  <h2>Register Client</h2>
  <form method="POST">
    <input name="name" placeholder="Name" required /><br>
    <input name="account" placeholder="Account Number" required /><br>
    <input name="phone" placeholder="Phone" required /><br>
    <input name="image" placeholder="Image URL" required /><br>
    <button>Create</button>
  </form>
  `);
});

app.post("/register", (req, res) => {
  const { name, account, phone, image } = req.body;

  db.run(
    "INSERT INTO clients (name, account, phone, image) VALUES (?, ?, ?, ?)",
    [name, account, phone, image],
    function () {
      res.send(`
      <h2 style="color:green;">Client Created ✅</h2>

      <p>Shareable Links:</p>

      <a href="/client/${this.lastID}">🔗 Client Page</a><br><br>
      <a href="/pay/${this.lastID}">💳 Payment Page</a>
      `);
    }
  );
});

// ---------------- CLIENT PAGE (WELCOME PAGE) ----------------
app.get("/client/:id", (req, res) => {
  db.get("SELECT * FROM clients WHERE id=?", [req.params.id], (err, c) => {
    if (!c) return res.send("Not found");

    res.send(`
    <style>
      body {
        background: linear-gradient(to right, #000, #3b0000);
        color: white;
        text-align: center;
        font-family: Arial;
      }
      .card {
        margin-top: 50px;
        padding: 20px;
      }
      img {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        border: 3px solid gold;
      }
      .box {
        margin-top: 20px;
        background: rgba(255,255,255,0.1);
        padding: 15px;
        display: inline-block;
        border-radius: 10px;
      }
      a {
        color: gold;
        font-size: 20px;
      }
    </style>

    <div class="card">
      <h1>Welcome to FREEMANSON666</h1>

      <img src="${c.image}" />

      <div class="box">
        <h2>${c.name}</h2>
        <p>Account: ${c.account}</p>
        <p>Phone: ${c.phone}</p>
      </div>

      <br><br>
      <a href="/pay/${c.id}">👉 Proceed to Payment</a>
    </div>
    `);
  });
});

// ---------------- PAYMENT PAGE ----------------
app.get("/pay/:id", (req, res) => {
  db.get("SELECT * FROM clients WHERE id=?", [req.params.id], (err, c) => {

    res.send(`
    <style>
      body {
        background: black;
        color: white;
        text-align: center;
        font-family: Arial;
      }
      input, button {
        padding: 10px;
        margin: 5px;
      }
      button {
        background: gold;
        border: none;
        cursor: pointer;
      }
    </style>

    <h2>Pay for ${c.name}</h2>

    <form method="POST">
      <input name="phone" placeholder="Your Mobile Number" required /><br>
      <input name="amount" placeholder="Amount" required /><br>
      <button>Pay Now</button>
    </form>
    `);
  });
});

// ---------------- SAVE PAYMENT ----------------
app.post("/pay/:id", (req, res) => {
  const { phone, amount } = req.body;

  db.run(
    "INSERT INTO payments (client_id, phone, amount, status) VALUES (?, ?, ?, ?)",
    [req.params.id, phone, amount, "PENDING"],
    function () {
      res.send(`
      <h2 style="color:green;">Payment Sent ✅</h2>
      <p>Status: PENDING</p>
      <a href="/">Back Home</a>
      `);
    }
  );
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log("Server running on http://localhost:3000");
});