// Test Resend Email Configuration
// Run with: node test-email.mjs

import { Resend } from 'resend';

const resend = new Resend('re_Vgq4Ps9J_LbRxanCqf9MkmvaiFeByLtvD');

async function testEmail() {
  console.log('Testing Resend email configuration...\n');
  
  try {
    console.log('Attempting to send test email...');
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's test domain
      to: 'maromgiladb@gmail.com',
      subject: 'Test Email from NDA SaaS',
      html: '<strong>If you see this, your Resend API key works!</strong>'
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Success! Email sent:', data);
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testEmail();
