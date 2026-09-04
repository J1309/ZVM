/**
 * ZoomieVan Responsive HTML Email Templates
 * Designed with inline CSS for maximum compatibility across Gmail, Apple Mail, Outlook, and mobile clients.
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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #071A3D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #071A3D;">
  <!-- Preheader text (hidden preview in inbox) -->
  <div style="display: none; font-size: 1px; color: #071A3D; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #071A3D;">
    <tr>
      <td align="center" style="padding: 24px 12px 36px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 20px 0 24px 0;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; text-decoration: none;">
                      🐾 ZOOMIE<span style="color: #F59E0B;">VAN</span>
                    </span>
                    <div style="font-size: 11px; font-weight: 700; color: #93C5FD; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
                      Mobile Canine Gym &amp; Fitness
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT CARD -->
          <tr>
            <td style="background-color: #0F2756; border: 1px solid #1E3A70; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);">
              ${contentHtml}
            </td>
          </tr>

          <!-- BRAND FOOTER -->
          <tr>
            <td align="center" style="padding: 28px 16px; color: #7E9ED2; font-size: 12px; line-height: 18px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #93C5FD;">
                ZoomieVan Inc. · Edmonton &amp; Surrounding Areas, Alberta
              </p>
              <p style="margin: 0 0 8px 0;">
                Questions or changes? Reply directly to this email or call us at <a href="tel:7809051414" style="color: #F59E0B; text-decoration: none; font-weight: 700;">(780) 905-1414</a>.
              </p>
              <p style="margin: 0; color: #5073A8; font-size: 11px;">
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
    <div style="height: 6px; background: linear-gradient(90deg, #F59E0B, #E11D48, #3B82F6);"></div>

    <div style="padding: 36px 28px;">
      <!-- Welcome Badge -->
      <div style="display: inline-block; padding: 6px 14px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 20px; font-size: 11px; font-weight: 800; color: #FCD34D; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
        🎉 Welcome To The Pack
      </div>

      <h1 style="margin: 0 0 16px 0; color: #FFFFFF; font-size: 24px; font-weight: 800; line-height: 32px;">
        Hey ${data.userName || 'Dog Parent'}, congratulations on joining ZoomieVan!
      </h1>

      <p style="margin: 0 0 20px 0; color: #D1E0F7; font-size: 15px; line-height: 24px;">
        We are thrilled to welcome you and your furry best friend to Edmonton’s premier climate-controlled mobile dog fitness gym! We bring safe, high-energy workouts right to your doorstep.
      </p>

      <!-- Next Steps Box -->
      <div style="background-color: #071A3D; border: 1px solid #1E3A70; border-radius: 14px; padding: 20px; margin-bottom: 28px;">
        <h3 style="margin: 0 0 12px 0; color: #F59E0B; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
          Next Steps To Book Your First Run:
        </h3>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="28" valign="top" style="padding-bottom: 12px; font-size: 16px;">1️⃣</td>
            <td style="padding-bottom: 12px; color: #FFFFFF; font-size: 14px; line-height: 20px;">
              <strong>Fill In Dog Vitals:</strong> Tell us your pup's name, breed, weight, age, and energy level.
            </td>
          </tr>
          <tr>
            <td width="28" valign="top" style="padding-bottom: 12px; font-size: 16px;">2️⃣</td>
            <td style="padding-bottom: 12px; color: #FFFFFF; font-size: 14px; line-height: 20px;">
              <strong>Upload Vet Vaccine Record:</strong> Provide proof of Rabies &amp; DHPP vaccination for safe boarding.
            </td>
          </tr>
          <tr>
            <td width="28" valign="top" style="font-size: 16px;">3️⃣</td>
            <td style="color: #FFFFFF; font-size: 14px; line-height: 20px;">
              <strong>Quick Phone Coordination:</strong> Our owner calls you to agree on your preferred session date and time window!
            </td>
          </tr>
        </table>
      </div>

      <!-- Call to Action Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${data.dashboardUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; background-color: #F59E0B; color: #071A3D; font-size: 15px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              Complete Your Dog's Profile &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 24px 0 0 0; text-align: center; color: #7E9ED2; font-size: 13px;">
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
    <div style="height: 6px; background: linear-gradient(90deg, #10B981, #059669, #F59E0B);"></div>

    <div style="padding: 36px 28px;">
      <!-- Verification Badge -->
      <div style="display: inline-block; padding: 6px 14px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; font-size: 11px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
        ✓ Profile Approved &amp; Cleared
      </div>

      <h1 style="margin: 0 0 16px 0; color: #FFFFFF; font-size: 24px; font-weight: 800; line-height: 32px;">
        ${data.dogName ? `${data.dogName} is verified &amp; ready to roll!` : 'Your profile is approved!'}
      </h1>

      <p style="margin: 0 0 20px 0; color: #D1E0F7; font-size: 15px; line-height: 24px;">
        Hi ${data.userName || 'there'}, our team has reviewed your canine profile and veterinary certificate. Everything looks fantastic and your account is officially cleared!
      </p>

      <!-- Agreed Session Details Box -->
      ${data.sessionDate ? `
      <div style="background-color: #071A3D; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 10px 0; color: #F59E0B; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
          📅 Agreed Session Details (Phone Confirmed):
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 6px;" width="110">Date:</td>
            <td style="color: #FFFFFF; font-size: 14px; font-weight: 700; padding-bottom: 6px;">${data.sessionDate}</td>
          </tr>
          ${data.timeSlot ? `
          <tr>
            <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 6px;">Pickup Window:</td>
            <td style="color: #FFFFFF; font-size: 14px; font-weight: 700; padding-bottom: 6px;">${data.timeSlot}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #7E9ED2; font-size: 13px;">Pup:</td>
            <td style="color: #FFFFFF; font-size: 14px; font-weight: 700;">🐾 ${data.dogName || 'Your Dog'}</td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- Offer Highlight -->
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.05)); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 18px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; color: #FCD34D; font-size: 14px; font-weight: 800;">
          ⭐ Founding Member Special: 3 Sessions for $70 CAD
        </p>
        <p style="margin: 0; color: #D1E0F7; font-size: 13px; line-height: 19px;">
          Includes your 1st agreed session above plus 2 bonus runs! To guarantee your mobile van reservation and lock in the schedule, please finalize your payment.
        </p>
      </div>

      <!-- CTA Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${data.dashboardUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; background-color: #10B981; color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              Lock In Session &amp; Pay $70 &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 20px 0 0 0; text-align: center; color: #7E9ED2; font-size: 12px;">
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
    <div style="height: 6px; background: linear-gradient(90deg, #10B981, #3B82F6, #F59E0B);"></div>

    <div style="padding: 36px 28px;">
      <!-- Success Badge -->
      <div style="display: inline-block; padding: 6px 14px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; font-size: 11px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
        ✓ Payment Confirmed &amp; Session Locked
      </div>

      <h1 style="margin: 0 0 16px 0; color: #FFFFFF; font-size: 24px; font-weight: 800; line-height: 32px;">
        You're officially locked in, ${data.userName || 'Friend'}!
      </h1>

      <p style="margin: 0 0 24px 0; color: #D1E0F7; font-size: 15px; line-height: 24px;">
        Thank you for your order! Your payment has been received and ${data.dogName ? `<strong>${data.dogName}</strong>'s` : 'your dog\'s'} first session is officially confirmed on our mobile van schedule.
      </p>

      <!-- Order Receipt Table -->
      <div style="background-color: #071A3D; border: 1px solid #1E3A70; border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
        <div style="padding: 14px 18px; background-color: #0B2149; border-bottom: 1px solid #1E3A70;">
          <span style="font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 1px;">
            Receipt &amp; Order Summary
          </span>
        </div>
        <div style="padding: 18px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 8px;">Package:</td>
              <td align="right" style="color: #FFFFFF; font-size: 14px; font-weight: 700; padding-bottom: 8px;">
                ${data.planName || 'Trial Run (Founding Member)'}
              </td>
            </tr>
            <tr>
              <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 8px;">Pup:</td>
              <td align="right" style="color: #FFFFFF; font-size: 14px; font-weight: 700; padding-bottom: 8px;">
                🐾 ${data.dogName || 'Your Dog'}
              </td>
            </tr>
            <tr>
              <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 8px;">Date:</td>
              <td align="right" style="color: #FFFFFF; font-size: 13px; padding-bottom: 8px;">
                ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 12px;">Status:</td>
              <td align="right" style="color: #10B981; font-size: 12px; font-weight: 800; text-transform: uppercase; padding-bottom: 12px;">
                ✓ PAID
              </td>
            </tr>
            <tr>
              <td colspan="2" style="border-top: 1px solid #1E3A70; padding-top: 12px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="color: #FFFFFF; font-size: 15px; font-weight: 800;">Total Charged:</td>
                    <td align="right" style="color: #F59E0B; font-size: 18px; font-weight: 900;">${data.amountPaid || '$70.00 CAD'}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Confirmed Run Details Box -->
      ${data.sessionDate ? `
      <div style="background-color: #071A3D; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #10B981; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
          🚐 Confirmed 1st Run Schedule:
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 6px;" width="110">Scheduled Date:</td>
            <td style="color: #FFFFFF; font-size: 14px; font-weight: 700; padding-bottom: 6px;">${data.sessionDate}</td>
          </tr>
          ${data.timeSlot ? `
          <tr>
            <td style="color: #7E9ED2; font-size: 13px; padding-bottom: 6px;">Pickup Window:</td>
            <td style="color: #FFFFFF; font-size: 14px; font-weight: 700; padding-bottom: 6px;">${data.timeSlot}</td>
          </tr>
          ` : ''}
          ${data.address ? `
          <tr>
            <td style="color: #7E9ED2; font-size: 13px;">Doorstep Address:</td>
            <td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">${data.address}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}

      <!-- Preparation Checklist -->
      <div style="background-color: #071A3D; border: 1px solid #1E3A70; border-radius: 14px; padding: 20px; margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; color: #F59E0B; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
          Session Day Quick Checklist:
        </h3>
        <ul style="margin: 0; padding-left: 18px; color: #D1E0F7; font-size: 13px; line-height: 20px;">
          <li><strong>No heavy meals:</strong> Avoid feeding your dog a large meal within 2 hours before the session.</li>
          <li><strong>Collar or harness ready:</strong> Have your pup ready with their regular collar or harness for transfer to the van.</li>
          <li><strong>Text notification:</strong> Our handler will send a quick text when the van is arriving at your driveway!</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${data.dashboardUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; background-color: #F59E0B; color: #071A3D; font-size: 15px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              View Your Dashboard &amp; Runs &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;

  return baseLayout(title, preheader, content);
}
