import express, { Express, NextFunction, Request, Response } from 'express';
import authrouter from './routers/auth.router';
import { customCors } from './middlewares/cors.middleware';

const app: Express = express();

app.use(customCors);

app.use(express.json());
const port = 8000;

app.use('/api/auth', authrouter);

app.get('/', (_: Request, res: Response) => {
    res.send('<h1>Hello World!</h1>');
});


app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false, 
    message: error?.message, 
    data: null
  })
})


app.listen(port, () => {
    console.log(` ⚡️⚡️ Server is running at http://localhost:${port}`);
})