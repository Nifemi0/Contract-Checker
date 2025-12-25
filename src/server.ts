import express from 'express';
import cors from 'cors';
import { ContractCheckerEngine } from './index'; // Re-exporting class from index or using it directly if exported
import * as dotenv from 'dotenv';
import path from 'path';

// Fix for default export issue if it arises, but we exported the class named in index.ts.
// Actually, looking at index.ts, I exported ContractCheckerEngine class.

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.static('public'));

// Initialize Engine
const engine = new ContractCheckerEngine(process.env.RPC_URL);

app.get('/api/analyze', async (req, res) => {
    const address = req.query.address as string;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        const result = await engine.analyze(address);
        res.json(result);
    } catch (error: any) {
        console.error("Analysis error:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
