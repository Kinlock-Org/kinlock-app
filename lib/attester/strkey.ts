/**
 * Lightweight StrKey validator for Stellar Ed25519 public keys (G-addresses).
 * Implements RFC 4648 Base32 decoding and CRC-16 XModem checksum verification.
 * Zero external dependencies.
 */

const RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ED25519_PUBLIC_KEY_VERSION_BYTE = 6 << 3; // 48 (0x30) -> encoded 'G'

export function isValidEd25519PublicKey(str: string): boolean {
  if (typeof str !== "string" || str.length !== 56 || str[0] !== "G") {
    return false;
  }

  const decoded = new Uint8Array(35);
  let buffer = 0;
  let bits = 0;
  let count = 0;

  for (let i = 0; i < str.length; i++) {
    const val = RFC4648_ALPHABET.indexOf(str[i] as string);
    if (val === -1) {
      return false;
    }
    buffer = (buffer << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      decoded[count++] = (buffer >> bits) & 0xff;
    }
  }

  if (count !== 35) {
    return false;
  }

  if (decoded[0] !== ED25519_PUBLIC_KEY_VERSION_BYTE) {
    return false;
  }

  // Calculate CRC-16 XModem over the version byte and 32 payload bytes
  let crc = 0x0000;
  for (let i = 0; i < 33; i++) {
    const byte = decoded[i] as number;
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }

  const expectedCrc = (decoded[33] as number) | ((decoded[34] as number) << 8);
  return crc === expectedCrc;
}
