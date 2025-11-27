import express, { Express, Request, Response } from 'express';

const app: Express = express();
app.use(express.json());
const port = 8000;

app.get('/', (_: Request, res: Response) => {
    res.send('<h1>Hello World!</h1>');
});



app.listen(port, () => {
    console.log(` ⚡️⚡️ Server is running at http://localhost:${port}`);
})