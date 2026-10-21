package lias_lab.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${lias.mail.from}")
    private String fromEmail;

    // ── Email Acceptation simple ──────────────────────────────────────────────
    public void sendAcceptanceEmail(String toEmail, String firstName, String lastName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Laboratoire LIAS");
            helper.setTo(toEmail);
            helper.setSubject("Votre demande d'adhesion au laboratoire LIAS a ete acceptee");

            String html = """
                <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                  <div style="background: linear-gradient(135deg, #1e3a6e, #2563eb); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                      <span style="color: white; font-size: 20px; font-weight: 900;">LIAS</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 22px;">Laboratoire LIAS</h1>
                    <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">Faculte des Sciences Ben M'Sik - Casablanca</p>
                  </div>
                  <div style="background: white; padding: 36px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #059669; font-size: 20px; margin-top: 0;">Felicitations, %s %s !</h2>
                    <p style="color: #374151; line-height: 1.7; font-size: 15px;">
                      Nous avons le plaisir de vous informer que votre demande d'adhesion au
                      <strong>Laboratoire d'Informatique et Applications Scientifiques (LIAS)</strong>
                      a ete <strong style="color: #059669;">acceptee</strong>.
                    </p>
                    <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                      <p style="color: #065f46; margin: 0; font-size: 14px;">
                        Vos identifiants de connexion vous seront communiques prochainement
                        par l'administrateur du laboratoire.
                      </p>
                    </div>
                    <p style="color: #374151; line-height: 1.7; font-size: 15px;">
                      Bienvenue dans notre equipe ! Nous sommes ravis de vous compter parmi
                      les membres du laboratoire LIAS.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                      Laboratoire LIAS - Faculte des Sciences Ben M'Sik, Casablanca
                    </p>
                  </div>
                </div>
                """.formatted(firstName, lastName);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Erreur envoi email acceptation : " + e.getMessage());
        }
    }

    // ── Email Acceptation avec identifiants ───────────────────────────────────
    public void sendAcceptanceEmailWithCredentials(
            String toEmail, String firstName, String lastName,
            String email, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Laboratoire LIAS");
            helper.setTo(toEmail);
            helper.setSubject("Bienvenue au laboratoire LIAS - Vos identifiants de connexion");

            String html = """
                <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                  <div style="background: linear-gradient(135deg, #1e3a6e, #2563eb); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                      <span style="color: white; font-size: 20px; font-weight: 900;">LIAS</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 22px;">Laboratoire LIAS</h1>
                    <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">Faculte des Sciences Ben M'Sik - Casablanca</p>
                  </div>
                  <div style="background: white; padding: 36px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #059669; font-size: 20px; margin-top: 0;">Felicitations, %s %s !</h2>
                    <p style="color: #374151; line-height: 1.7; font-size: 15px;">
                      Votre demande d'adhesion au <strong>Laboratoire d'Informatique et Applications Scientifiques (LIAS)</strong>
                      a ete <strong style="color: #059669;">acceptee</strong>.
                      Un compte a ete cree pour vous.
                    </p>

                    <div style="background: #f0fdf4; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0;">
                      <p style="color: #065f46; margin: 0 0 16px; font-size: 16px; font-weight: 700; text-align: center;">
                        Vos identifiants de connexion
                      </p>
                      <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #a7f3d0;">
                        <p style="color: #6b7280; margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                        <p style="color: #1e293b; margin: 0; font-size: 15px; font-weight: 600;">%s</p>
                      </div>
                      <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #a7f3d0;">
                        <p style="color: #6b7280; margin: 0 0 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Mot de passe temporaire</p>
                        <p style="color: #1e293b; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 3px; font-family: monospace; background: #f0fdf4; padding: 10px 16px; border-radius: 8px; border: 2px dashed #059669; text-align: center;">%s</p>
                      </div>
                    </div>

                    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                      <p style="color: #92400e; margin: 0; font-size: 13px;">
                        <strong>Important :</strong> Ce mot de passe est temporaire. Veuillez le changer des votre premiere connexion dans <strong>Parametres</strong>.
                      </p>
                    </div>

                    <div style="text-align: center; margin-bottom: 24px;">
                      <a href="http://localhost:5173/login"
                        style="background: linear-gradient(135deg, #1e3a6e, #2563eb); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                        Se connecter au portail
                      </a>
                    </div>

                    <p style="color: #374151; line-height: 1.7; font-size: 15px;">
                      Bienvenue dans notre equipe ! Nous sommes ravis de vous compter parmi
                      les membres du laboratoire LIAS.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                      Laboratoire LIAS - Faculte des Sciences Ben M'Sik, Casablanca
                    </p>
                  </div>
                </div>
                """.formatted(firstName, lastName, email, tempPassword);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Erreur envoi email avec credentials : " + e.getMessage());
        }
    }

    // ── Email Refus ───────────────────────────────────────────────────────────
    public void sendRefusalEmail(String toEmail, String firstName, String lastName, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Laboratoire LIAS");
            helper.setTo(toEmail);
            helper.setSubject("Votre demande d'adhesion au laboratoire LIAS");

            String reasonHtml = (reason != null && !reason.isBlank())
                    ? """
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                    <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Motif :</strong> %s</p>
                  </div>
                  """.formatted(reason)
                    : "";

            String html = """
                <div style="font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                  <div style="background: linear-gradient(135deg, #1e3a6e, #2563eb); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                      <span style="color: white; font-size: 20px; font-weight: 900;">LIAS</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 22px;">Laboratoire LIAS</h1>
                    <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">Faculte des Sciences Ben M'Sik - Casablanca</p>
                  </div>
                  <div style="background: white; padding: 36px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #dc2626; font-size: 20px; margin-top: 0;">Demande d'adhesion - %s %s</h2>
                    <p style="color: #374151; line-height: 1.7; font-size: 15px;">
                      Nous avons bien examine votre demande d'adhesion au
                      <strong>Laboratoire LIAS</strong>.
                      Apres etude de votre dossier, nous sommes dans l'obligation de vous informer
                      que votre demande n'a pas pu etre retenue a ce stade.
                    </p>
                    %s
                    <p style="color: #374151; line-height: 1.7; font-size: 15px;">
                      Nous vous encourageons a soumettre une nouvelle demande ulterieurement
                      ou a contacter le laboratoire pour plus d'informations.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                      Laboratoire LIAS - Faculte des Sciences Ben M'Sik, Casablanca
                    </p>
                  </div>
                </div>
                """.formatted(firstName, lastName, reasonHtml);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Erreur envoi email refus : " + e.getMessage());
        }
    }
}