
"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";

const UPI_ID = "7503922183@kotakbank";
const UPI_LINK =
  "upi://pay?pa=7503922183%40kotakbank&pn=Outlier%20Academy&cu=INR&tn=Support%20Outlier%20Academy";

export default function DonatePage() {
  return (
    <main className="donate-shell">
      <section className="donate-intro">
        <p className="eyebrow">SUPPORT INDEPENDENT LEARNING</p>

        <h1>
          Help knowledge
          <br />
          <em>stay accessible.</em>
        </h1>

        <p className="donate-description">
          Outlier Academy creates learning resources across mathematics,
          finance, programming, AI and emerging technology. If our work has
          helped you, you can support us with any amount you choose.
        </p>
      </section>

      <section className="donate-card">
        <div className="donate-card-copy">
          <p className="eyebrow">DIRECT UPI CONTRIBUTION</p>
          <h2>Donate your way.</h2>
          <p>
            Scan the QR code using any compatible UPI app, or open the
            payment link on your phone. Enter the amount you want to
            contribute in your UPI app.
          </p>

          <div className="donate-recipient">
            <span>Recipient</span>
            <strong>Mustak Aalam</strong>
          </div>

          {/* <div className="donate-recipient">
            <span>UPI ID</span>
            <strong className="donate-upi-id">{UPI_ID}</strong>
          </div> */}

          <a className="button button-primary donate-upi-button" href={UPI_LINK}>
            Open UPI app <span aria-hidden="true">↗</span>
          </a>

          <p className="donate-note">
            Before paying, verify the recipient name and amount in your
            UPI app.
          </p>
        </div>

        <div className="donate-qr-panel">
          <div className="donate-qr">
            <QRCodeSVG
              value={UPI_LINK}
              size={220}
              level="H"
              marginSize={2}
              title="Outlier Academy UPI donation QR code"
            />
          </div>
          <h3>Scan to contribute</h3>
          <p>Choose your own amount in your UPI app.</p>
          <span className="donate-qr-caption">UPI · INR</span>
        </div>
      </section>

      <p className="donate-disclaimer">
        This is a direct UPI payment, not an online payment gateway. The
        website does not automatically verify payments. Please check the
        recipient details before confirming your transaction.
      </p>

      <Link href="/" className="back-link">
        ← Back to Outlier Academy
      </Link>
    </main>
  );
}
