import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { User } from "@prisma/client";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sender = new Sender("no-reply@sharify.in", "Sharify Verification");

async function SendVerificationEmail(user: User, key: string) {
  const recipient = [new Recipient(user.email)];

  const variables = [
    {
      email: user.email,
      substitutions: [
        {
          var: "verification_url",
          value: `${process.env.FRONTEND_URL}/email?code=${key}`,
        },
        {
          var: "username",
          value: user.username,
        },
      ],
    },
  ];

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipient)
    .setTemplateId("neqvygmr0zzl0p7w")
    .setVariables(variables);

  await mailerSend.email.send(emailParams);
}

export { SendVerificationEmail };
