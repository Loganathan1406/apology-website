const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const EXCEL_FILE = path.join(DATA_DIR, "responses.xlsx");

app.use(express.json({ limit: "100kb" }));
app.use(express.static(PUBLIC_DIR));

const HEADERS = [
  "Name",
  "Phone Number",
  "Attempt 1",
  "Attempt 2",
  "Attempt 3",
  "Attempt 4",
  "Attempt 5",
  "Attempt 6",
  "Final Response",
  "Attempts",
  "Last Updated"
];

function ensureWorkbook() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(EXCEL_FILE)) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, EXCEL_FILE);
  }
}

function readRows() {
  ensureWorkbook();
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets["Responses"];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function writeRows(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  XLSX.writeFile(wb, EXCEL_FILE);
}

function clean(value, maxLength = 100) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizePhone(value) {
  return clean(value, 30).replace(/[^\d+]/g, "");
}

app.post("/api/response", (req, res) => {
  try {
    const sessionId = clean(req.body.sessionId, 100);
    const name = clean(req.body.name, 100);
    const phone = normalizePhone(req.body.phone);
    const responses = Array.isArray(req.body.responses)
      ? req.body.responses.slice(0, 6).map(v => clean(v, 30))
      : [];
    const finalResponse = clean(req.body.finalResponse, 30);

    if (!sessionId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, phone number and session ID are required."
      });
    }

    const rows = readRows();
    const now = new Date().toISOString();

    let row = rows.find(item => item["Session ID"] === sessionId);

    // Session ID is deliberately kept as an internal column so the same
    // visitor can update one Excel row after every click.
    if (!row) {
      row = {
        "Name": name,
        "Phone Number": phone,
        "Attempt 1": "",
        "Attempt 2": "",
        "Attempt 3": "",
        "Attempt 4": "",
        "Attempt 5": "",
        "Attempt 6": "",
        "Final Response": "",
        "Attempts": 0,
        "Last Updated": now,
        "Session ID": sessionId
      };
      rows.push(row);
    }

    row["Name"] = name;
    row["Phone Number"] = phone;

    responses.forEach((value, index) => {
      row[`Attempt ${index + 1}`] = value;
    });

    row["Final Response"] = finalResponse || row["Final Response"] || "";
    row["Attempts"] = responses.filter(Boolean).length;
    row["Last Updated"] = now;

    // Keep Session ID in the workbook as an internal technical key.
    // It is not shown anywhere on the webpage.
    const internalHeaders = [...HEADERS, "Session ID"];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: internalHeaders });
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, EXCEL_FILE);

    res.json({ success: true });
  } catch (error) {
    console.error("Excel write error:", error);
    res.status(500).json({
      success: false,
      message: "Could not save the response."
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Apology website server is running." });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  ensureWorkbook();
  console.log(`Apology website running at http://localhost:${PORT}`);
  console.log(`Excel file: ${EXCEL_FILE}`);
});
