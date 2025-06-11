const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// 創建 Next.js 應用
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 自簽名證書（僅用於開發）
const httpsOptions = {
  key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wQNneCjGQJw2TM5WH0ObBvRFnhQiinXCxdrMGCLtfEcxaBYjFfFSxZqZHli+Q4M
s5wSFsT7x+lW4x8riRcKVWJe2BnmRy5m4Fc89d+jJbuCiXheTurGb7lUD/3ctv
pWQVRLqdxGq2aJdQd+u7UQg6bdFUfIBRe1gtFr2YsqxpyWmgtdSjIlc7BYNb0/
aq5MpgHjYyDNNfuKFe9gQHNiP1y2ayXi3BWsAdHdLMC4sAm9cOitTDjZVM9EQBz
/wjk8S/5CWrBOtzxFC99Rvtw6KuKdVNyGJBbtj+bc+BcSPUKpCD+jb89WhhhcKc
AgMBAAECggEBALc2lQGY5f6i9zGKs+XRUOaI9ILMwBwjmSJRNrx0HpjpOQiuJDlb
MPfm8WZhEsqH0Q6eYmRt9e/jy+oQdz2yoXZ5LxMhdi2tSS8KQSQDVaoGx/xaU4F
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTIwOTEyMjE1MjAyWhcNMTUwOTEyMjE1MjAyWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1L7VLPHCgcEDZ3goxkCcNkzOVh9DmwbURZ4UIop1wsXazBgi7XxH
MWgWIxXxUsWamR5YvkODLOcEhbE+8fpVuMfK4kXClViXtgZ5kcuZuBXPPXfoyW7g
ol4Xk7qxm+5VA/93Lb6VkFUS6ncRqtmiXUHfru1EIOm3RVHyAUXtYLRa9mLKsacl
poLXUoyJXOwWDW9P2quTKYB42MgzTX7ihXvYEBzYj9ctmsl4twVrAHR3SzAuLAJv
XDorUw42VTPREAc/8I5PEv+QlqwTrc8RQvfUb7cOirinVTchiQW7Y/m3PgXEj1Cq
Qg/o2/PVoYYXCnAIDQQABo1OeIhXeTI5txlePBhnDx0K1Mq9H5knHf7hQQIDAQAB
o1AwTjAdBgNVHQ4EFgQUhBjMhTTsvAyUlC4IWZzHshBOCggwHwYDVR0jBBgwFoAU
hBjMhTTsvAyUlC4IWZzHshBOCggwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUF
AAOCAQEAw5Oipg0pnfmwasoDKpGXBfRy0RdoQ4ck2o+/PbTDrNLWBL2SEuTcpS/t
F/ck5+vuU9+WYpsiHLoHxLOxflqQwDnyBIlwuGsGN0aplcAhz5Nc5StdwStjjSLV
VVKo27ZzEyD2k+StdYhUTMhtzpFf2DEKvwvHpIyfrh+Dw9TdSmAhw340YqiPIDBk
uA0wEpB3DiVNTGombaU2dDup2gwKdL81ua8EIcGNExHe82kjF4zwfadHk+CSSML/
lRFnNrAaEMhqVrwh40U4sySWc9NzSh8TZ/em8Iql6JOjYniXkHXKUF0fxMKdqppB
dJeSNiMh+iL/OjMh6wDA5Q==
-----END CERTIFICATE-----`
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on https://${hostname}:${port}`);
    console.log('> Note: This uses a self-signed certificate for development only');
    console.log('> You may need to accept the security warning in your browser');
  });
}); 