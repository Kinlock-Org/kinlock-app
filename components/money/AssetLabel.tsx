/** Always shows asset code AND issuer, never the code alone. Roadmap M3-15. */
export function AssetLabel({ code, issuer }: { code: string; issuer: string }) {
  return (
    <span>
      {code} <small>{issuer}</small>
    </span>
  );
}
