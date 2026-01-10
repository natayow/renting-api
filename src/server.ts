import express, { Express, NextFunction, Request, Response } from 'express';
import path from 'path';
import authrouter from './routers/auth.router';
import propertyTypeRouter from './routers/propertyType.router';
import locationRouter from './routers/location.router';
import propertyRouter from './routers/property.router';
import { customCors } from './middlewares/cors.middleware';
import facilityRouter from './routers/facility.router';
import roomRouter from './routers/room.router';
import bookingRouter from './routers/booking.router';

const app: Express = express();

app.use(customCors);

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const port = 8000;

app.use('/api/auth', authrouter);
app.use('/api/property-types', propertyTypeRouter);
app.use('/api/locations', locationRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/facilities', facilityRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/bookings', bookingRouter);

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