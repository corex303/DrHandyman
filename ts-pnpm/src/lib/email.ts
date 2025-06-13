import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    react?: React.ReactElement;
    attachments?: {
        filename: string;
        content: Buffer;
    }[];
}

export const sendEmail = async (options: EmailOptions) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `"Dr. Handyman" <noreply@drhandymanc.com>`, // Replace with your verified sender domain in Resend
            to: options.to,
            subject: options.subject,
            text: options.text,
            react: options.react,
            attachments: options.attachments,
        });

        if (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }

        console.log('Message sent: %s', data?.id);
        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}; 