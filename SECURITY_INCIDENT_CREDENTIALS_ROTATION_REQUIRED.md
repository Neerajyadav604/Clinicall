# 🚨 SECURITY INCIDENT — CREDENTIAL ROTATION REQUIRED

## Status
**URGENT** — All credentials exposed in git repository must be rotated immediately.

## Issue
The `.env` file containing production secrets was committed to the git repository before being added to `.gitignore`. The following credentials have been exposed:

### Exposed Credentials Requiring Rotation

1. **MongoDB Connection String**
   - URL: `mongodb+srv://dheeraj0987bhari:***@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase`
   - Status: **MUST ROTATE** — Change MongoDB password and regenerate connection string

2. **JWT Secrets**
   - `JWT_SECRET`: v8Y@3jK!zR^9q#H)1LpXf*5nS%gE2mB&dFutN
   - `REFRESH_TOKEN_SECRET`: f79beead5de031c7c338ed43d3fa2c0fdedbf506b9e13957e3f6f82196700cf4593141eb8e1fcf45e19b3926d39bae9c35d1d7c69cb28df452644e5708bf20b8
   - Status: **MUST ROTATE** — Generate new secrets immediately
   - Action: All existing JWT tokens will be invalidated; users will need to re-login

3. **Cloudinary API Credentials**
   - Key: 132572196126261
   - Secret: KzrEAVKM7zHD7yrQZ9GntTZCEl0
   - Status: **MUST ROTATE** — Regenerate API credentials in Cloudinary console

4. **Razorpay API Keys**
   - Test Key: rzp_test_RBoOLhayPnCcZ8
   - Secret: PGH2vvO4HM91rPsqHYP72rHh
   - Status: **MUST ROTATE** — Regenerate in Razorpay merchant dashboard

5. **Gmail SMTP Credentials**
   - Email: dheeraj0987bhari@gmail.com
   - App Password: rgta gtaj fujx pnbe
   - Status: **MUST ROTATE** — Generate new App Password in Gmail settings

6. **FHIR OAuth Credentials**
   - Client ID: clinicall-client
   - Client Secret: f2KgwP0IfrHvTvsjUQ6PwjR6JZZ+3Ww2AAramehNWTKvmwGQfUABVLC9ocHYahEx+IGNXXLGnTwrLDClEZTVUQ==
   - Status: **MUST ROTATE** — Regenerate in FHIR provider admin console

7. **Encryption Keys**
   - FIELD_ENC_KEY: clinicall_super_secure_key_123456
   - ENCRYPTION_KEY: 12345678901234567890123456789012
   - Status: **MUST ROTATE** — Generate new random 32-character keys
   - Note: Existing encrypted data will require re-encryption with new keys

8. **Session Secret**
   - SESSION_SECRET: clinicall-oauth-secret
   - Status: **MUST ROTATE** — Generate new random secret

## Remediation Steps

### Immediate Actions (Within 24 hours)
1. [ ] Notify security team and management of the incident
2. [ ] Rotate MongoDB credentials and test connectivity
3. [ ] Rotate JWT secrets and redeploy backend
4. [ ] Rotate Cloudinary API credentials
5. [ ] Rotate Razorpay API credentials
6. [ ] Rotate Gmail app password
7. [ ] Rotate FHIR OAuth credentials
8. [ ] Generate new encryption keys
9. [ ] Update all environment configurations
10. [ ] Force all users to re-authenticate (invalidate existing sessions)

### Follow-up Actions
1. [ ] Review git history for sensitive data commits
2. [ ] Consider using `git-filter-repo` to remove secrets from git history
3. [ ] Implement pre-commit hooks to prevent secrets from being committed
4. [ ] Audit all external services for unauthorized access
5. [ ] Enable 2FA/MFA on all service accounts
6. [ ] Document this incident and lessons learned

### Code Changes Made
- ✅ `.env` added to `.gitignore` (already present)
- ✅ `server/.env` should be removed from git history using: `git rm --cached server/.env && git commit -m "Remove exposed .env file"`
- ⚠️ Fallback encryption keys with default values removed from model files (see PHASE 2-1)
- ⚠️ Session secret fallback removed from index.js (see PHASE 4-7)

### Environment Configuration
Create/update `server/.env.example` with placeholders:

```env
# ===== Core Configuration =====
PORT=4000
NODE_ENV=production

# ===== Database =====
DATABASEURL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?appName=<app>

# ===== JWT Authentication =====
JWT_SECRET=<generate-new-32-char-random-string>
REFRESH_TOKEN_SECRET=<generate-new-64-char-random-hex-string>

# ===== Encryption =====
FIELD_ENC_KEY=<generate-new-32-char-random-string>
ENCRYPTION_KEY=<generate-new-32-char-random-string>
SESSION_SECRET=<generate-new-32-char-random-string>

# ===== Cloudinary (Image Storage) =====
CLOUD_NAME=<your-cloudinary-name>
CLOUD_API_KEY=<your-cloudinary-api-key>
CLOUD_API_SECRET=<your-cloudinary-api-secret>
FOLDER_NAME=ClinicallFolder

# ===== Razorpay (Payments) =====
RAZORPAY_KEY=<your-razorpay-key>
RAZORPAY_SECRET=<your-razorpay-secret>

# ===== Gmail SMTP (Email) =====
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<your-gmail-address>
MAIL_PASS=<your-gmail-app-password>
MAIL_FROM=noreply@clinicall.com

# ===== FHIR Integration =====
FHIR_SERVER_URL=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/
FHIR_CLIENT_ID=<your-fhir-client-id>
FHIR_CLIENT_SECRET=<your-fhir-client-secret>
FHIR_SERVER_DISCOVERY_URL=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/api/FHIR/R4/.well-known/openid-configuration
FHIR_REDIRECT_URI=http://localhost:4000/auth/fhir/callback
FHIR_SCOPES=launch/patient openid fhirUser patient/*.read patient/*.write

# ===== Frontend URLs =====
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:4000
REACT_APP_BASE_URL=http://localhost:4000
REACT_APP_API_BASE_URL=http://localhost:4000/api/v1
REACT_APP_SOCKET_URL=http://localhost:4000

# ===== Security Features =====
CORS_ORIGINS=http://localhost:3000,http://localhost:4000
HELMET_ENABLED=true
RATE_LIMITING_ENABLED=true
BREACH_DETECTION_ENABLED=true
DATA_INTEGRITY_CHECKS_ENABLED=true

# ===== Logging =====
LOG_LEVEL=info
```

## Git History Cleanup

To remove the exposed `.env` file from git history:

```bash
# Navigate to repository root
cd "c:\Users\DELL\OneDrive\Documents\Clinicall Backend"

# Option 1: Using git filter-repo (recommended, requires installation)
git filter-repo --path server/.env --invert-paths

# Option 2: Using git filter-branch (slower, built-in)
git filter-branch --tree-filter 'rm -f server/.env' --prune-empty HEAD

# Then force-push (use with caution in shared repos)
git push origin --force --all
git push origin --force --tags
```

⚠️ **WARNING**: Force-pushing will rewrite history. Notify all team members before doing this.

## Verification Checklist

- [ ] All credentials have been rotated
- [ ] New `.env` file created with new credentials
- [ ] `.env` is in `.gitignore`
- [ ] Backend redeployed with new credentials
- [ ] All API integrations tested and working
- [ ] Users have been forced to re-authenticate
- [ ] No console errors related to authentication
- [ ] Git history cleaned of exposed credentials (if applicable)

## References

- [OWASP: Top 10 - A02:2021 Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP: Credentials Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Git: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**Generated**: 2026-03-16
**Severity**: 🔴 CRITICAL
**Action**: Require immediate attention from team lead
