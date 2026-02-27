// back/src/services/mailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendResetPasswordEmail = async (email, resetLink) => {
    try {
        console.log(`📡 Preparing reset email for: ${email}`);

        // If credentials are missing, we log the link to the terminal for debugging
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('-----------------------------------------');
            console.log('⚠️  EMAIL CREDENTIALS MISSING IN .ENV');
            console.log(`🔗 RESET LINK: ${resetLink}`);
            console.log('-----------------------------------------');
            return true;
        }

        const mailOptions = {
            from: `"Axia Workflow" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                    <h1 style="color: #4f46e5; text-align: center;">Réinitialisation de mot de passe</h1>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Axia Workflow.</p>
                    <p>Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Réinitialiser mon mot de passe</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">Ce lien expirera dans 1 heure.</p>
                    <p style="color: #64748b; font-size: 14px;">Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Axia Workflow Solutions</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending reset email:', error);
        throw error;
    }
};

module.exports = {
    sendResetPasswordEmail
};
