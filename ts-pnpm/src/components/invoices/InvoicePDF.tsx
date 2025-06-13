import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Invoice, User, InvoiceLineItem } from '@prisma/client';

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        paddingTop: 30,
        paddingLeft: 60,
        paddingRight: 60,
        paddingBottom: 30,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    invoiceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    tableCol: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 60,
        right: 60,
        textAlign: 'center',
        color: 'grey',
    },
});

type InvoiceWithRelations = Invoice & {
    customer: User;
    lineItems: InvoiceLineItem[];
};

interface InvoicePDFProps {
    invoice: InvoiceWithRelations;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Invoice</Text>
            </View>

            <View style={styles.invoiceInfo}>
                <View>
                    <Text>Invoice Number: {invoice.id}</Text>
                    <Text>Date: {new Date(invoice.createdAt).toLocaleDateString()}</Text>
                    <Text>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
                </View>
                <View>
                    <Text>To:</Text>
                    <Text>{invoice.customer.name}</Text>
                    <Text>{invoice.customer.email}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <View style={styles.tableColHeader}><Text>Description</Text></View>
                    <View style={styles.tableColHeader}><Text>Quantity</Text></View>
                    <View style={styles.tableColHeader}><Text>Unit Price</Text></View>
                    <View style={styles.tableColHeader}><Text>Total</Text></View>
                </View>
                {invoice.lineItems.map(item => (
                    <View style={styles.tableRow} key={item.id}>
                        <View style={styles.tableCol}><Text>{item.description}</Text></View>
                        <View style={styles.tableCol}><Text>{item.quantity}</Text></View>
                        <View style={styles.tableCol}><Text>{item.unitPrice.toFixed(2)}</Text></View>
                        <View style={styles.tableCol}><Text>{item.totalPrice.toFixed(2)}</Text></View>
                    </View>
                ))}
            </View>
            
            <Text style={{ textAlign: 'right', marginTop: 20 }}>
                Total: {invoice.lineItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2)}
            </Text>

            <View style={styles.footer}>
                <Text>Thank you for your business!</Text>
            </View>
        </Page>
    </Document>
);

export default InvoicePDF;

 