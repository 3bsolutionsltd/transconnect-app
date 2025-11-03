import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import QRCode from 'qrcode';

const router = Router();

// Generate QR code for booking
router.post('/generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    const userId = (req as any).user.userId;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                model: true
              }
            },
            operator: {
              select: {
                companyName: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized for this booking' });
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'QR code only available for confirmed or pending bookings' });
    }

    // Generate comprehensive QR data
    const qrData = {
      bookingId: booking.id,
      passengerName: `${booking.user.firstName} ${booking.user.lastName}`,
      route: `${booking.route.origin} → ${booking.route.destination}`,
      seatNumber: booking.seatNumber,
      travelDate: booking.travelDate.toISOString().split('T')[0],
      busPlate: booking.route.bus.plateNumber,
      operator: booking.route.operator.companyName,
      amount: booking.totalAmount,
      generatedAt: new Date().toISOString(),
      signature: generateBookingSignature(booking.id, booking.userId)
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update booking with new QR code if needed
    if (booking.qrCode !== qrCodeDataURL) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { qrCode: qrCodeDataURL }
      });
    }

    res.json({
      qrCode: qrCodeDataURL,
      qrData,
      bookingDetails: {
        id: booking.id,
        route: `${booking.route.origin} → ${booking.route.destination}`,
        seatNumber: booking.seatNumber,
        travelDate: booking.travelDate,
        status: booking.status,
        amount: booking.totalAmount
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Validate QR code (for operators/conductors)
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { qrData, scannedBy, location } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    let parsedData;
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    const { bookingId, signature } = parsedData;

    if (!bookingId) {
      return res.status(400).json({ error: 'Invalid QR code: missing booking ID' });
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: {
          include: {
            bus: true,
            operator: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        verification: true
      }
    });

    if (!booking) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Booking not found' 
      });
    }

    // Verify signature
    const expectedSignature = generateBookingSignature(booking.id, booking.userId);
    if (signature !== expectedSignature) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid QR code signature' 
      });
    }

    // Check booking status
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return res.status(400).json({ 
        valid: false, 
        error: `Booking status is ${booking.status}` 
      });
    }

    // Check if already verified
    if (booking.verification) {
      return res.json({
        valid: true,
        alreadyScanned: true,
        scanDetails: {
          scannedAt: booking.verification.scannedAt,
          scannedBy: booking.verification.scannedBy
        },
        bookingDetails: {
          passengerName: `${booking.user.firstName} ${booking.user.lastName}`,
          route: `${booking.route.origin} → ${booking.route.destination}`,
          seatNumber: booking.seatNumber,
          travelDate: booking.travelDate,
          busPlate: booking.route.bus.plateNumber
        }
      });
    }

    // Create verification record
    await prisma.verification.create({
      data: {
        bookingId: booking.id,
        scannedBy: scannedBy || 'Unknown',
        location: location || null
      }
    });

    res.json({
      valid: true,
      alreadyScanned: false,
      bookingDetails: {
        passengerName: `${booking.user.firstName} ${booking.user.lastName}`,
        route: `${booking.route.origin} → ${booking.route.destination}`,
        seatNumber: booking.seatNumber,
        travelDate: booking.travelDate,
        busPlate: booking.route.bus.plateNumber,
        operator: booking.route.operator.companyName
      }
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Failed to validate QR code' 
    });
  }
});

// Get QR code for existing booking
router.get('/booking/:bookingId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.userId;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        qrCode: true,
        status: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized for this booking' });
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'QR code only available for confirmed or pending bookings' });
    }

    res.json({
      qrCode: booking.qrCode,
      bookingId: booking.id
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

// Helper function to generate booking signature
function generateBookingSignature(bookingId: string, userId: string): string {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const data = `${bookingId}:${userId}:${secret}`;
  
  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

export default router;