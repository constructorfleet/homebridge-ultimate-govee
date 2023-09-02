import { readPkcs12 } from 'pem';
import type { Pkcs12ReadResult } from 'pem';
import NodeRSA from 'node-rsa';

export type CertBundle = {
    certificate: Buffer;
    privateKey: Buffer;
};

export const pfxToBundle = async (pfxFilePath: string, p12Password: string): Promise<CertBundle> => new Promise((resolve, reject) => {
  readPkcs12(pfxFilePath, { p12Password }, (err, cert: Pkcs12ReadResult) => {
    if (err) {
      reject(err);
    }
    try {
      const key: NodeRSA = new NodeRSA(cert.key);
      resolve({
        certificate: Buffer.from(cert.cert, 'utf8'),
        privateKey: Buffer.from(key.exportKey('pkcs8'), 'utf8'),
      });
    } catch (error) {
      reject(error);
    }
  });
});