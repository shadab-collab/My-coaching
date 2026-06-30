const Ledger = require("../models/ledger");

// नई Ledger Entry
exports.addEntry = async (data) => {
  
  try {
    
    const entry = new Ledger({
      
      studentId: data.studentId || null,
      
      familyCode: data.familyCode || "",
      
      receiptNo: data.receiptNo || "",
      
      month: data.month,
      
      year: data.year,
      
      amount: data.amount,
      
      paymentMode: data.paymentMode || "Cash",
      
      collectedBy: data.collectedBy || "Shadab",
      
      note: data.note || ""
      
    });
    
    await entry.save();
    
    return entry;
    
  } catch (err) {
    
    console.log(err);
    
  }
  
};

// आज का Collection
exports.todayCollection = async (req, res) => {
  
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  
  const total = await Ledger.aggregate([
    
    {
      $match: {
        createdAt: {
          $gte: today
        }
      }
    },
    
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount"
        }
      }
    }
    
  ]);
  
  res.json(total[0] || { total: 0 });
  
};

// Monthly Collection
exports.monthCollection = async (req, res) => {
  
  const { month, year } = req.params;
  
  const total = await Ledger.aggregate([
    
    {
      $match: {
        month,
        year: Number(year)
      }
    },
    
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount"
        }
      }
    }
    
  ]);
  
  res.json(total[0] || { total: 0 });
  
};