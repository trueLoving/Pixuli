import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import './LanShareQrCode.css';

interface LanShareQrCodeProps {
  url: string;
  label?: string;
  size?: number;
}

export const LanShareQrCode: React.FC<LanShareQrCodeProps> = ({
  url,
  label,
  size = 192,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setDataUrl(null);
    void QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then(next => {
        if (!cancelled) setDataUrl(next);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (error) {
    return null;
  }

  if (!dataUrl) {
    return (
      <div
        className="lan-share-qr lan-share-qr--loading"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <figure className="lan-share-qr">
      <img
        src={dataUrl}
        width={size}
        height={size}
        alt={label || url}
        className="lan-share-qr-image"
      />
      {label ? (
        <figcaption className="lan-share-qr-caption">{label}</figcaption>
      ) : null}
    </figure>
  );
};
