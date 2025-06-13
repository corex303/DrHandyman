import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';
// import { sendInvoiceEmail } from '@/lib/email'; // Assuming you have an email sending utility

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { isAuthenticated } = verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
      },
    });

    if (!invoice || !invoice.customer) {
      return NextResponse.json({ error: 'Invoice or customer not found' }, { status: 404 });
    }

    // await sendInvoiceEmail(invoice.customer.email, invoice);

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT' },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error(`Failed to send invoice ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
} 