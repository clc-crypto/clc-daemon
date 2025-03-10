import { createHash } from "crypto";

function sha256(cnt: string): string {
    return createHash('sha256').update(cnt).digest('hex');
}

export { sha256 };