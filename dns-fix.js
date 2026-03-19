// Force Node.js to use Google DNS instead of the local resolver
// This fixes the EREFUSED issue with neon.tech domains
const dns = require('dns');
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Override the default lookup to use our custom resolver
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
    // For neon.tech domains, use our custom resolver
    if (typeof hostname === 'string' && hostname.includes('neon.tech')) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        resolver.resolve4(hostname, (err, addresses) => {
            if (err) {
                // Fall back to default lookup
                return originalLookup.call(dns, hostname, options, callback);
            }
            callback(null, addresses[0], 4);
        });
    } else {
        originalLookup.call(dns, hostname, options, callback);
    }
};

console.log('[DNS] Using Google DNS (8.8.8.8) for neon.tech domains');
