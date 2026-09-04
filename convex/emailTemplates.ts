/**
 * ZoomieVan Professional HTML Email Templates
 * Designed with a clean, standard corporate aesthetic (light background, crisp white card, dark typography).
 * Compatible across Gmail, Apple Mail, Outlook, and mobile clients.
 */

export interface WelcomeEmailData {
  userName: string;
  dashboardUrl: string;
}

export interface VerificationEmailData {
  userName: string;
  dogName: string;
  sessionDate?: string;
  timeSlot?: string;
  dashboardUrl: string;
}

export interface OrderConfirmationEmailData {
  userName: string;
  dogName: string;
  planName: string;
  amountPaid: string;
  sessionDate?: string;
  timeSlot?: string;
  address?: string;
  dashboardUrl: string;
}

function baseLayout(title: string, preheader: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; color: #334155;">
  <!-- Preheader text (hidden preview in inbox) -->
  <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 32px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; text-decoration: none;">
                      🐾 ZOOMIE<span style="color: #D97706;">VAN</span>
                    </span>
                    <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px;">
                      Mobile Canine Gym &amp; Fitness
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT CARD -->
          <tr>
            <td style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
              ${contentHtml}
            </td>
          </tr>

          <!-- BRAND FOOTER -->
          <tr>
            <td align="center" style="padding: 24px 16px; color: #64748B; font-size: 12px; line-height: 18px;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                ZoomieVan Inc. · Edmonton &amp; Surrounding Areas, Alberta
              </p>
              <p style="margin: 0 0 8px 0;">
                Questions or changes? Reply directly to this email or call us at <a href="tel:7809051414" style="color: #0F172A; text-decoration: underline; font-weight: 600;">(780) 905-1414</a>.
              </p>
              <p style="margin: 0; color: #94A3B8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} ZoomieVan Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1st Mail: Welcome & Congratulations on Registering
 */
export function getWelcomeEmailHtml(data: WelcomeEmailData): string {
  const title = "Welcome to ZoomieVan! Complete Your Dog's Profile 🐾";
  const preheader = "Welcome to the pack! Just a few quick details about your pup to get started.";

  const content = `
    <!-- Top Accent Bar -->
    <div style="height: 4px; background-color: #D97706;"></div>

    <div style="padding: 32px 28px;">
      <!-- Welcome Badge -->
      <div style="display: inline-block; padding: 4px 10px; background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 16px; font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
        Welcome To The Pack
      </div>

      <h1 style="margin: 0 0 16px 0; color: #0F172A; font-size: 22px; font-weight: 700; line-height: 30px;">
        Hey ${data.userName || 'Dog Parent'}, congratulations on joining ZoomieVan!
      </h1>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 24px;">
        We are thrilled to welcome you and your furry best friend to Edmonton’s premier mobile dog fitness gym! We bring safe, high-energy slatmill workouts right to your doorstep.
      </p>

      <!-- Next Steps Box -->
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px 20px; margin-bottom: 26px;">
        <h3 style="margin: 0 0 12px 0; color: #0F172A; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          Next Steps To Book Your First Run:
        </h3>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="26" valign="top" style="padding-bottom: 10px; font-size: 14px;">1️⃣</td>
            <td style="padding-bottom: 10px; color: #334155; font-size: 14px; line-height: 20px;">
              <strong style="color: #0F172A;">Fill In Dog Vitals:</strong> Tell us your pup's name, breed, weight, age, and energy level.
            </td>
          </tr>
          <tr>
            <td width="26" valign="top" style="padding-bottom: 10px; font-size: 14px;">2️⃣</td>
            <td style="padding-bottom: 10px; color: #334155; font-size: 14px; line-height: 20px;">
              <strong style="color: #0F172A;">Upload Vet Vaccine Record:</strong> Provide proof of Rabies &amp; DHPP vaccination for safe boarding.
            </td>
          </tr>
          <tr>
            <td width="26" valign="top" style="font-size: 14px;">3️⃣</td>
            <td style="color: #334155; font-size: 14px; line-height: 20px;">
              <strong style="color: #0F172A;">Quick Phone Coordination:</strong> Our team calls you to coordinate your preferred session date and pickup window.
            </td>
          </tr>
        </table>
      </div>

      <!-- Call to Action Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${data.dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              Complete Your Dog's Profile &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 20px 0 0 0; text-align: center; color: #64748B; font-size: 12px;">
        Takes less than 2 minutes · Safe &amp; verified by our team
      </p>
    </div>
  `;

  return baseLayout(title, preheader, content);
}

/**
 * 2nd Mail: Admin Verifies Profile & Phone Call Completed (Request Payment)
 */
export function getVerificationEmailHtml(data: VerificationEmailData): string {
  const title = `Great News! ${data.dogName || "Your Dog"}'s Profile is Approved & Ready 🐾`;
  const preheader = "Your canine profile is verified! Complete payment to lock in your session.";

  const content = `
    <!-- Top Accent Bar -->
    <div style="height: 4px; background-color: #059669;"></div>

    <div style="padding: 32px 28px;">
      <!-- Verification Badge -->
      <div style="display: inline-block; padding: 4px 10px; background-color: #D1FAE5; border: 1px solid #A7F3D0; border-radius: 16px; font-size: 11px; font-weight: 700; color: #065F46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
        ✓ Profile Approved
      </div>

      <h1 style="margin: 0 0 16px 0; color: #0F172A; font-size: 22px; font-weight: 700; line-height: 30px;">
        ${data.dogName ? `${data.dogName} is verified &amp; ready to roll!` : 'Your profile is approved!'}
      </h1>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 24px;">
        Hi ${data.userName || 'there'}, our team has reviewed your canine profile and veterinary certificate. Everything looks fantastic and your account is officially cleared!
      </p>

      <!-- Agreed Session Details Box -->
      ${data.sessionDate ? `
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px 20px; margin-bottom: 22px;">
        <h3 style="margin: 0 0 10px 0; color: #0F172A; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          📅 Agreed Session Details (Phone Confirmed):
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="color: #64748B; font-size: 13px; padding-bottom: 6px;" width="120">Date:</td>
            <td style="color: #0F172A; font-size: 14px; font-weight: 600; padding-bottom: 6px;">${data.sessionDate}</td>
          </tr>
          ${data.timeSlot ? `
          <tr>
            <td style="color: #64748B; font-size: 13px; padding-bottom: 6px;">Pickup Window:</td>
            <td style="color: #0F172A; font-size: 14px; font-weight: 600; padding-bottom: 6px;">${data.timeSlot}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #64748B; font-size: 13px;">Pup:</td>
            <td style="color: #0F172A; font-size: 14px; font-weight: 600;">🐾 ${data.dogName || 'Your Dog'}</td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- Offer Highlight -->
      <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px 20px; margin-bottom: 26px;">
        <p style="margin: 0 0 4px 0; color: #92400E; font-size: 14px; font-weight: 700;">
          ⭐ Founding Member Special: 3 Sessions for $70 CAD
        </p>
        <p style="margin: 0; color: #78350F; font-size: 13px; line-height: 19px;">
          Includes your 1st agreed session above plus 2 bonus runs! To guarantee your mobile van reservation and lock in the schedule, please finalize your payment.
        </p>
      </div>

      <!-- CTA Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${data.dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #059669; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              Lock In Session &amp; Pay $70 &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 18px 0 0 0; text-align: center; color: #64748B; font-size: 12px;">
        Secure Canadian Stripe checkout · Immediate confirmation
      </p>
    </div>
  `;

  return baseLayout(title, preheader, content);
}

/**
 * 3rd Mail: Order & Booking Confirmation
 */
export function getOrderConfirmationEmailHtml(data: OrderConfirmationEmailData): string {
  const title = `Order Confirmed! ${data.dogName || "Your Dog"}'s Session is Locked 🚐💨`;
  const preheader = `Payment received for ${data.planName}. See your scheduled session details and prep guide.`;

  const content = `
    <!-- Top Accent Bar -->
    <div style="height: 4px; background-color: #0F172A;"></div>

    <div style="padding: 32px 28px;">
      <!-- Success Badge -->
      <div style="display: inline-block; padding: 4px 10px; background-color: #D1FAE5; border: 1px solid #A7F3D0; border-radius: 16px; font-size: 11px; font-weight: 700; color: #065F46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
        ✓ Payment Confirmed
      </div>

      <h1 style="margin: 0 0 16px 0; color: #0F172A; font-size: 22px; font-weight: 700; line-height: 30px;">
        You're officially locked in, ${data.userName || 'Friend'}!
      </h1>

      <p style="margin: 0 0 22px 0; color: #334155; font-size: 15px; line-height: 24px;">
        Thank you for your order! Your payment has been received and ${data.dogName ? `<strong>${data.dogName}</strong>'s` : 'your dog\'s'} first session is officially confirmed on our mobile van schedule.
      </p>

      <!-- Order Receipt Table -->
      <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; margin-bottom: 22px;">
        <div style="padding: 12px 18px; background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
          <span style="font-size: 12px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
            Receipt &amp; Order Summary
          </span>
        </div>
        <div style="padding: 16px 18px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #64748B; font-size: 13px; padding-bottom: 8px;">Package:</td>
              <td align="right" style="color: #0F172A; font-size: 14px; font-weight: 600; padding-bottom: 8px;">
                ${data.planName || 'Trial Run (Founding Member)'}
              </td>
            </tr>
            <tr>
              <td style="color: #64748B; font-size: 13px; padding-bottom: 8px;">Pup:</td>
              <td align="right" style="color: #0F172A; font-size: 14px; font-weight: 600; padding-bottom: 8px;">
                🐾 ${data.dogName || 'Your Dog'}
              </td>
            </tr>
            <tr>
              <td style="color: #64748B; font-size: 13px; padding-bottom: 8px;">Date:</td>
              <td align="right" style="color: #0F172A; font-size: 13px; padding-bottom: 8px;">
                ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td style="color: #64748B; font-size: 13px; padding-bottom: 12px;">Status:</td>
              <td align="right" style="color: #059669; font-size: 12px; font-weight: 700; text-transform: uppercase; padding-bottom: 12px;">
                ✓ PAID
              </td>
            </tr>
            <tr>
              <td colspan="2" style="border-top: 1px solid #E2E8F0; padding-top: 12px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="color: #0F172A; font-size: 14px; font-weight: 700;">Total Charged:</td>
                    <td align="right" style="color: #0F172A; font-size: 16px; font-weight: 800;">${data.amountPaid || '$70.00 CAD'}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Confirmed Run Details Box -->
      ${data.sessionDate ? `
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px 20px; margin-bottom: 22px;">
        <h3 style="margin: 0 0 10px 0; color: #0F172A; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          🚐 Confirmed 1st Run Schedule:
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="color: #64748B; font-size: 13px; padding-bottom: 6px;" width="120">Scheduled Date:</td>
            <td style="color: #0F172A; font-size: 14px; font-weight: 600; padding-bottom: 6px;">${data.sessionDate}</td>
          </tr>
          ${data.timeSlot ? `
          <tr>
            <td style="color: #64748B; font-size: 13px; padding-bottom: 6px;">Pickup Window:</td>
            <td style="color: #0F172A; font-size: 14px; font-weight: 600; padding-bottom: 6px;">${data.timeSlot}</td>
          </tr>
          ` : ''}
          ${data.address ? `
          <tr>
            <td style="color: #64748B; font-size: 13px;">Doorstep Address:</td>
            <td style="color: #0F172A; font-size: 14px; font-weight: 600;">${data.address}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}

      <!-- Preparation Checklist -->
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px 20px; margin-bottom: 26px;">
        <h3 style="margin: 0 0 10px 0; color: #0F172A; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          Session Day Quick Checklist:
        </h3>
        <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 13px; line-height: 20px;">
          <li><strong style="color: #0F172A;">No heavy meals:</strong> Avoid feeding your dog a large meal within 2 hours before the session.</li>
          <li><strong style="color: #0F172A;">Collar or harness ready:</strong> Have your pup ready with their regular collar or harness for transfer to the van.</li>
          <li><strong style="color: #0F172A;">Text notification:</strong> Our handler will send a quick text when the van is arriving at your driveway!</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${data.dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              View Your Dashboard &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;

  return baseLayout(title, preheader, content);
}
