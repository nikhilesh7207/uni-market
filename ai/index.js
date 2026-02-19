const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Mock Data for Recommendations
const categories = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Other'];

app.get('/recommend', (req, res) => {
    const { userId } = req.query;
    // Simple logic: recommend random category
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    res.json({ recommendedCategory: randomCategory, reason: "Based on trending items" });
});

app.post('/moderate', (req, res) => {
    const { text } = req.body;
    const forbiddenWords = ['abuse', 'hate', 'scam'];
    const isFlagged = forbiddenWords.some(word => text.toLowerCase().includes(word));

    res.json({ isFlagged, flaggedWords: isFlagged ? forbiddenWords.filter(w => text.includes(w)) : [] });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`AI Service running on port ${PORT}`));
