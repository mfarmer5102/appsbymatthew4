# Database CA certificates

## supabase-prod-ca-2021.crt

The root CA for Supabase's Postgres pooler. It is self-signed and not in Node's trust
store, so `pg` cannot verify the connection without it — the failure looks like:

```
Error: self-signed certificate in certificate chain   (SELF_SIGNED_CERT_IN_CHAIN)
```

`src/_library/classes/postgres.js` reads this file by default, which is what lets Lambda
and App Runner connect with certificate verification on and no TLS configuration of
their own. Keep it in the deployment package.

| | |
|---|---|
| Subject | `CN=Supabase Root 2021 CA, O=Supabase Inc, C=US` |
| SHA-256 | `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA` |
| Expires | 2031-04-26 |

Verify the fingerprint against the copy from the Supabase dashboard (Project Settings →
Database → SSL Configuration) before trusting it:

```bash
openssl x509 -in certs/supabase-prod-ca-2021.crt -noout -fingerprint -sha256 -subject -dates
```

Replacing it later is just a matter of dropping in the new file; `PGSSL_ROOT_CERT` can
point at a newer CA in the meantime.
