import { GoogleGenerativeAI } from "@google/generative-ai";
import Invoice from '../models/Invoice.js'; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const scanInvoiceImage = async (req, res) => {
  try {
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

    // 🔥 FIX 1: Universal Stable Model for Image
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("🤖 [AI Scanner] Sending image to Google Gemini AI... Please wait.");

    const result = await model.generateContent([prompt, imagePart]);
    let responseText = result.response.text();

    console.log("✨ [AI Scanner] Raw AI Response:\n", responseText);

    // 🔥 FIX 2: Syntax Error Removed (No Enter space in regex)
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(responseText);

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

/// ============================================================================
// 🔥 AI Financial Advisor (Smart Analytics) - WITH ANTI-CRASH FAILSAFE
// ============================================================================
export const getFinancialInsights = async (req, res) => {
  try {
    console.log("🧠 [AI Advisor] Fetching financial data for insights...");

    const invoices = await Invoice.find({ 
      user: req.user._id, 
      isDeleted: false 
    }).populate('tenant');
    
    let totalRevenue = 0;
    let pendingAmount = 0;
    let unpaidClients = [];

    invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        totalRevenue += inv.amount;
      } else {
        pendingAmount += inv.amount;
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

    try {
      // 🟢 ATTEMPT 1: Google Gemini API ko try karo
      console.log("🤖 [AI Advisor] Analyzing data with Gemini...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const aiInsight = result.response.text().trim();

      console.log("✨ [AI Advisor] Google AI Insight Generated successfully!");
      return res.status(200).json({ success: true, insight: aiInsight });

    } catch (apiError) {
      // 🔴 ATTEMPT 2: Agar Google API Render ke server location ki wajah se fail ho jaye!
      console.error("⚠️ [Google API Failed - Region/Key Issue]:", apiError.message);
      console.log("🛡️ [Failsafe Active] Generating automatic system insight to prevent 500 Crash...");

      // Backend khud ek AI jaisa logic lagayega aur dashboard crash nahi hone dega
      let fallbackInsight = `Your total collected revenue is $${totalRevenue}. `;
      
      if (pendingAmount > 0) {
        fallbackInsight += `Focus on recovering $${pendingAmount} pending from ${unpaidClients.length} clients (${unpaidClients.slice(0, 2).join(', ')}${unpaidClients.length > 2 ? ' etc' : ''}).`;
      } else {
        fallbackInsight += `Excellent work! All your active client invoices are fully paid. Keep growing!`;
      }

      return res.status(200).json({ 
        success: true, 
        insight: fallbackInsight 
      });
    }

  } catch (error) {
    console.error("❌ [AI Advisor] Database/Server Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error", exact_error: error.message });
  }
};