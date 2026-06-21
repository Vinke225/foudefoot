const { createClient } = require('@supabase/supabase-js');
const client = createClient('http://localhost', 'key');
console.log(Object.keys(client.auth).filter(k => k.toLowerCase().includes('url')));
