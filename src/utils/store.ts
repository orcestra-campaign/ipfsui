import IPFSFetchStore from './ipfs/fetchStore';
import { FetchStore } from 'zarrita';

export function getStore(url: string | URL) {
	const [protocol, _] = (typeof url === "string" ? url : url.href).split(
		"://",
	);
	if (protocol === "ipfs" || protocol === "ipns") {
		return new IPFSFetchStore(url);
	} else {
        return new FetchStore(url);
    }
}