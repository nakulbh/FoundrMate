import express from 'express';
import dotenv from 'dotenv';
import emailRouter from './route';
import Cors from 'cors';
import { extractAccessToken } from './middleware';

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;

app.use(Cors({origin:true}))

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || 'not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '****' : 'not set');
console.log('PORT:', process.env.PORT || '4000 (default)');

// Mount the email router at the /email path
app.use(extractAccessToken as any);
app.use('/email', emailRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
