import http from 'http';
import https from 'https';
import { URL } from 'url';

function betterFetch(urlString: string, localAddress: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const isHttps = url.protocol === 'https:';

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: 'GET',
            localAddress: localAddress,
            headers: {
                'User-Agent': 'Node.js',
            },
        };

        const req = (isHttps ? https : http).request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.end();
    });
}

export default betterFetch;