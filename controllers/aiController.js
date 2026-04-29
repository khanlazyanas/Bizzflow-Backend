import { GoogleGenerativeAI } from "@google/generative-ai";
import Invoice from '../models/Invoice.js'; // 🔥 NAYA: Database access ke liye

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const scanInvoiceImage = async (req, res) => {
  try {
    // 🔍 LOG 1: Check karo ki route hit hua aur image aayi
    console.log("📸 [AI Scanner] Request received! Checking image...");

    if (!req.file) {
      console.log("❌ [AI Scanner] No image found in request.");
      return res.status(400).json({ success: false, message: "Please upload an invoice image." });
    }

    console.log(`✅ [AI Scanner] Image received: ${(req.file.size / 1024).toFixed(2)} KB`);

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `
      You are an expert accountant and data extractor. 
      Read the attached invoice/receipt image and extract the following details. 
      Return the response STRICTLY as a JSON object, without any markdown formatting, no comments, just the raw JSON.
      Required Keys:
      - clientName (string)
      - clientEmail (string, if not found make it "")
      - date (YYYY-MM-DD format)
      - items (array of objects, each object should have: name (string), quantity (number), price (number))
      - tax (number, if not found make it 0)
      - totalAmount (number)
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 🔍 LOG 2: AI ko data bhejte waqt
    console.log("🤖 [AI Scanner] Sending image to Google Gemini AI... Please wait.");

    const result = await model.generateContent([prompt, imagePart]);
    let responseText = result.response.text();

    // 🔍 LOG 3: AI ne jo raw answer diya wo print karo (Isse pata chalega AI ne kya padha)
    console.log("✨ [AI Scanner] Raw AI Response:\n", responseText);

    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(responseText);

    // 🔍 LOG 4: Final JSON data jo Frontend ko jayega
    console.log("🧠 [AI Scanner] Successfully Parsed Data ready for Frontend:", parsedData);

    res.status(200).json({
      success: true,
      message: "Invoice scanned successfully ✨",
      data: parsedData,
    });

  } catch (error) {
    console.error("❌ [AI Scanner] CRITICAL ERROR: ", error);
    res.status(500).json({ success: false, message: "Failed to scan invoice. Please try a clearer image." });
  }
};

// ============================================================================
// 🔥 NAYA FEATURE: AI Financial Advisor (Smart Analytics)
// ============================================================================
export const getFinancialInsights = async (req, res) => {
  try {
    console.log("🧠 [AI Advisor] Fetching financial data for insights...");

    // 🔥 FIX: 'tenantId' ki jagah 'tenant' ko populate kiya hai
    const invoices = await Invoice.find({ isDeleted: false }).populate('tenant');
    
    let totalRevenue = 0;
    let pendingAmount = 0;
    let unpaidClients = [];

    invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        totalRevenue += inv.amount;
      } else {
        pendingAmount += inv.amount;
        // 🔥 FIX: yahan bhi 'tenant' use kiya hai
        if (inv.tenant?.businessName) {
          unpaidClients.push(inv.tenant.businessName);
        }
      }
    });

    unpaidClients = [...new Set(unpaidClients)];

    if (totalRevenue === 0 && pendingAmount === 0) {
      return res.status(200).json({
        success: true,
        insight: "Welcome to BizFlow! Generate your first invoice to start getting AI-powered financial insights."
      });
    }

    const prompt = `
      You are an expert AI Financial Advisor for a B2B SaaS platform called BizFlow. 
      Analyze the following financial data for the user and give a short, punchy, and highly professional 2-sentence insight or advice. 
      Talk directly to the user (e.g., "Your revenue...", "Focus on...").
      Do NOT use markdown formatting, just plain text.
      
      Financial Data:
      - Total Revenue Collected: $${totalRevenue}
      - Pending/Unpaid Amount: $${pendingAmount}
      - Clients with pending invoices: ${unpaidClients.join(', ') || 'None'}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("🤖 [AI Advisor] Analyzing data with Gemini...");
    
    const result = await model.generateContent(prompt);
    const aiInsight = result.response.text().trim();

    console.log("✨ [AI Advisor] Insight Generated successfully!");

    res.status(200).json({
      success: true,
      insight: aiInsight
    });

  } catch (error) {
    console.error("❌ [AI Advisor] Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI insights." });
  }
};