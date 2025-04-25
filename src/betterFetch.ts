import http from 'http';
import https from 'https';
import { URL } from 'url';

function betterFetch(urlString: string, localAddress: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const isHttps = url.protocol === 'https:';

        const postData = typeof data === 'string' ? data : JSON.stringify(data);

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            localAddress: localAddress,
            headers: {
                'User-Agent': 'Node.js',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = (isHttps ? https : http).request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => resolve(responseData));
        });

        req.on('error', reject);
        req.write(postData); // send the data
        req.end();
    });
}

export default betterFetch;