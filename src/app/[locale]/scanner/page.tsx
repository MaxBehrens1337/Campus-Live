import { QRScanner } from "@/components/campus/qr-scanner/qr-scanner";

export default function ScannerPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <QRScanner />
    </main>
  );
}
