import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth/admin';
import { InvoiceStatus } from '@prisma/client';

// GET /api/admin/invoices
export async function GET(req: Request) {
    const { isAuthenticated } = verifyAdminSession();
    if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as InvoiceStatus | null;

    try {
        const invoices = await prisma.invoice.findMany({
            where: status ? { status } : {},
            include: {
                customer: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                lineItems: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

// POST /api/admin/invoices
export async function POST(req: Request) {
    const { isAuthenticated } = verifyAdminSession();
    if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { customerId, lineItems, ...invoiceData } = body;

        const newInvoice = await prisma.invoice.create({
            data: {
                ...invoiceData,
                customer: {
                    connect: { id: customerId },
                },
                lineItems: {
                    create: lineItems,
                },
            },
        });
        return NextResponse.json(newInvoice, { status: 201 });
    } catch (error) {
        console.error('Failed to create invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
} 