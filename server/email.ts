import { Resend } from 'resend';
import type { Registration, Class, ClassTemplate, User } from '@shared/schema';
import { sanitizeHtml, sanitizeText, sanitizeEmail, sanitizeNumeric } from './utils/sanitizer';
import { logger } from './utils/logger';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'bookings@breathwork.is';

interface RegistrationEmailData {
  registration: Registration;
  classItem: Class & { template: ClassTemplate };
  user: User;
  paymentInfo: {
    companyName: string;
    bankName: string;
    accountNumber: string;
    instructions: string;
  };
}

export async function sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
  if (!resend) {
    console.warn('Resend not configured - skipping email send');
    return false;
  }

  const { registration, classItem, user, paymentInfo } = data;

  try {
    const classDate = new Date(classItem.scheduledDate);
    const formattedDate = new Intl.DateTimeFormat('is-IS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(classDate);

    const formattedTime = new Intl.DateTimeFormat('is-IS', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(classDate);

    const price = classItem.customPrice || classItem.template.price;

    const emailHtml = `
<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bókun staðfest - Breathwork</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🌬️ Breathwork</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Öndunaræfingar á Íslandi</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #667eea; margin-top: 0;">Bókun þín hefur verið staðfest! ✓</h2>

    <p>Góðan daginn ${sanitizeText(user.firstName || '')},</p>

    <p>Þú hefur skráð þig í öndunaræfingu. Hér að neðan eru allar upplýsingar um tímann þinn:</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #667eea; font-size: 20px;">${sanitizeHtml(classItem.template.name)}</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>Bókunarnúmer:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${sanitizeText(registration.paymentReference || registration.id.substring(0, 10).toUpperCase())}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>Dagsetning:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>Tími:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${formattedTime} · ${classItem.template.duration} mín</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>Staðsetning:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${sanitizeText(classItem.location)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; border-top: 2px solid #e0e0e0; padding-top: 15px;"><strong>Upphæð:</strong></td>
          <td style="padding: 8px 0; text-align: right; border-top: 2px solid #e0e0e0; padding-top: 15px; font-size: 18px; color: #667eea;"><strong>${price.toLocaleString('is-IS')} kr.</strong></td>
        </tr>
      </table>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #856404;">💳 Greiðsluupplýsingar</h3>
      <p style="margin: 10px 0; color: #856404;"><strong>Vinsamlegast greiddu innan 24 klst.</strong></p>

      <table style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Banki:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404;">${sanitizeText(paymentInfo.bankName)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Reikningsnúmer:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404; font-family: 'Courier New', monospace; font-weight: bold;">${sanitizeText(paymentInfo.accountNumber)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Kennitala:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404;">${sanitizeText(paymentInfo.companyName)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Tilvitnun:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404; font-family: 'Courier New', monospace; font-weight: bold;">${sanitizeText(registration.paymentReference || registration.id.substring(0, 10).toUpperCase())}</td>
        </tr>
      </table>

      <p style="margin: 15px 0 5px 0; color: #856404; font-size: 14px;"><em>Mikilvægt: Vinsamlegast notaðu bókunarnúmerið þitt sem tilvitnun við greiðslu.</em></p>
    </div>

    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #0066cc;">ℹ️ Mikilvægar upplýsingar</h3>
      <ul style="margin: 10px 0; padding-left: 20px; color: #0066cc;">
        <li>Komdu 15 mínútum fyrir tímann</li>
        <li>Klæðstu í þægilegan fatnað</li>
        <li>Ekki borða þungan mat 2 klst. fyrir tímann</li>
        <li>Taktu með vatn</li>
      </ul>
    </div>

    <div style="margin: 30px 0; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <h3 style="color: #333;">Um öndunaræfinguna</h3>
      <p style="color: #666; line-height: 1.8;">${sanitizeHtml(classItem.template.description)}</p>
    </div>

    <p style="margin-top: 30px; color: #666;">
      <strong>Spurningar?</strong><br>
      Hafðu samband við okkur ef þú hefur einhverjar spurningar.
    </p>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 14px; margin: 0;">Hlökkum til að sjá þig!</p>
      <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">Breathwork ehf.</p>
    </div>

  </div>

</body>
</html>
    `;

    await resend.emails.send({
      from: `Breathwork <${FROM_EMAIL}>`,
      to: [sanitizeEmail(user.email)],
      subject: `Bókun staðfest - ${sanitizeText(classItem.template.name)} - ${formattedDate}`,
      html: emailHtml,
    });

    logger.info("Confirmation email sent", { email: user.email });
    return true;
  } catch (error) {
    logger.error('Failed to send confirmation email', { error: error.message });
    return false;
  }
}

export async function sendPaymentReminder(data: RegistrationEmailData): Promise<boolean> {
  if (!resend) {
    console.warn('Resend not configured - skipping email send');
    return false;
  }

  const { registration, classItem, user, paymentInfo } = data;

  try {
    const price = classItem.customPrice || classItem.template.price;

    const emailHtml = `
<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
  <title>Áminning um greiðslu - Breathwork</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🌬️ Breathwork</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #856404; margin-top: 0;">⏰ Áminning um greiðslu</h2>
      <p style="color: #856404; margin: 10px 0;"><strong>Bókunarnúmer: ${registration.paymentReference || registration.id.substring(0, 10).toUpperCase()}</strong></p>
    </div>

    <p>Góðan daginn ${sanitizeText(user.firstName || '')},</p>

    <p>Við höfum ekki enn móttekið greiðslu fyrir bókun þína.</p>

    <p><strong>Upphæð til greiðslu: ${price.toLocaleString('is-IS')} kr.</strong></p>

    <h3 style="color: #667eea;">Greiðsluupplýsingar:</h3>
    <table style="width: 100%; background: #f8f9fa; padding: 15px; border-radius: 8px;">
      <tr>
        <td style="padding: 5px 0;"><strong>Banki:</strong></td>
        <td style="padding: 5px 0; text-align: right;">${paymentInfo.bankName}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Reikningsnúmer:</strong></td>
        <td style="padding: 5px 0; text-align: right; font-family: 'Courier New', monospace; font-weight: bold;">${paymentInfo.accountNumber}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Tilvitnun:</strong></td>
        <td style="padding: 5px 0; text-align: right; font-family: 'Courier New', monospace; font-weight: bold;">${registration.paymentReference || registration.id.substring(0, 10).toUpperCase()}</td>
      </tr>
    </table>

    <p style="margin-top: 20px; color: #666;"><em>Vinsamlegast greiddu eins fljótt og auðið er til að staðfesta bókun þína.</em></p>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 14px; margin: 0;">Breathwork ehf.</p>
    </div>

  </div>

</body>
</html>
    `;

    await resend.emails.send({
      from: `Breathwork <${FROM_EMAIL}>`,
      to: [user.email],
      subject: `Áminning um greiðslu - Bókunarnúmer ${registration.paymentReference || registration.id.substring(0, 10).toUpperCase()}`,
      html: emailHtml,
    });

    console.log(`✓ Payment reminder sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment reminder:', error);
    return false;
  }
}
