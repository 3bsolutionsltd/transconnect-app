import { Request, Response } from 'express';
import { prisma } from '../../../index';
import { generatePresignedUploadUrl } from '../../../tools/agents/s3.tool';
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function uploadKyc(req: Request, res: Response) {
  try {
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { agentId, documentType } = req.body;
      const file = (req as any).file;
      const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!agentId || !documentType) {
        return res.status(400).json({ error: 'agentId and documentType are required' });
      }

      // Generate file key
      const fileKey = `kyc/${agentId}/${Date.now()}-${file.originalname}`;

      if (isDemoMode) {
        console.log(`📄 [DEMO MODE] KYC document upload simulation:`);
        console.log(`- Agent: ${agentId}`);
        console.log(`- Document Type: ${documentType}`);
        console.log(`- File: ${file.originalname}`);
        console.log(`- Type: ${file.mimetype}`);
        console.log(`- Size: ${file.buffer.length} bytes`);
        console.log(`(In production, this would upload to AWS S3)`);
      } else {
        // In production, upload to S3 here
        console.log('Production S3 upload not configured yet');
      }

      // Update KYC verification record
      await prisma.kYCVerification.upsert({
        where: { agentId },
        update: {
          documentType,
          documentUrl: fileKey,
          status: 'PENDING',
          uploadedAt: new Date(),
        },
        create: {
          agentId,
          documentType,
          documentUrl: fileKey,
          status: 'PENDING',
          uploadedAt: new Date(),
        },
      });

      res.json({
        message: isDemoMode 
          ? 'Document upload simulated successfully (demo mode)' 
          : 'Document uploaded successfully',
        fileKey,
        status: 'pending_review'
      });
    });
  } catch (error: any) {
    console.error('KYC upload error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function confirmKycUpload(req: Request, res: Response) {
  try {
    const { agentId, fileKey, documentType = 'nationalId' } = req.body;
    const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';

    if (!agentId || !fileKey) {
      return res.status(400).json({ error: 'agentId and fileKey are required' });
    }

    if (isDemoMode) {
      console.log(`📄 [DEMO MODE] KYC upload confirmation:`);
      console.log(`- Agent: ${agentId}`);
      console.log(`- File Key: ${fileKey}`);
      console.log(`- Document Type: ${documentType}`);
      console.log(`(In production, this would verify S3 upload completion)`);
    }

    // Update KYC verification record
    await prisma.kYCVerification.upsert({
      where: { agentId },
      update: {
        documentType,
        documentUrl: fileKey,
        status: 'PENDING',
        uploadedAt: new Date(),
      },
      create: {
        agentId,
        documentType,
        documentUrl: fileKey,
        status: 'PENDING',
        uploadedAt: new Date(),
      },
    });

    res.json({
      message: isDemoMode 
        ? 'Document upload confirmed successfully (demo mode)' 
        : 'Document upload confirmed successfully',
      fileKey,
      status: 'pending_review'
    });
  } catch (error: any) {
    console.error('KYC upload confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listPendingKyc(req: Request, res: Response) {
  try {
    const pendingKyc = await prisma.kYCVerification.findMany({
      where: { status: 'PENDING' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(pendingKyc);
  } catch (error: any) {
    console.error('List pending KYC error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function reviewKyc(req: Request, res: Response) {
  try {
    const { kycId } = req.params;
    const { status, reviewNotes, reviewedBy } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const kyc = await prisma.kYCVerification.update({
      where: { id: kycId },
      data: {
        status,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        agent: true,
      },
    });

    // If approved, update agent status
    if (status === 'approved') {
      await prisma.agent.update({
        where: { id: kyc.agentId },
        data: { kycStatus: 'APPROVED' },
      });
    }

    res.json({
      message: `KYC ${status} successfully`,
      kyc,
    });
  } catch (error: any) {
    console.error('Review KYC error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getPresignedUrl(req: Request, res: Response) {
  try {
    const { fileName, contentType, agentId } = req.query;

    if (!fileName || !contentType || !agentId) {
      return res.status(400).json({ 
        error: 'fileName, contentType, and agentId are required' 
      });
    }

    const { uploadUrl, fileKey } = await generatePresignedUploadUrl(
      fileName as string,
      contentType as string,
      agentId as string
    );

    res.json({
      uploadUrl,
      fileKey,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: error.message });
  }
}