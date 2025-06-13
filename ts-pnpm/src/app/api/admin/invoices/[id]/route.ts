import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';

// GET /api/admin/invoices/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { isAuthenticated } = verifyAdminSession();
    if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: {
                customer: true,
                lineItems: true,
                payments: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error(`Failed to fetch invoice ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}

// PUT /api/admin/invoices/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const { isAuthenticated } = verifyAdminSession();
    if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { customerId, lineItems, ...invoiceData } = body;

        const updatedInvoice = await prisma.invoice.update({
            where: { id: params.id },
            data: {
                ...invoiceData,
                ...(customerId && { customer: { connect: { id: customerId } } }),
                ...(lineItems && {
                    lineItems: {
                        deleteMany: {},
                        create: lineItems,
                    },
                }),
            },
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error(`Failed to update invoice ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}

// DELETE /api/admin/invoices/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { isAuthenticated } = verifyAdminSession();
    if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.invoice.delete({
            where: { id: params.id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete invoice ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }
} 