# Rainbow — Social App (MERN)

Short description
- Rainbow is a MERN social application (React + Redux + Express + MongoDB).
- Features: posts, stories, follow/connection system, direct messages (SSE), image uploads (ImageKit), auth (Clerk).

Quick links
- Frontend: /Frontend
- Backend: /Backend

---

## Local development

Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB Atlas (or local MongoDB)
- Clerk account, ImageKit account, SMTP credentials (Brevo/Sendinblue, etc.)

Install & run

Backend
```bash
cd Backend
npm install
# set env vars in Backend/.env (see below)
npm run dev   # or whatever script runs your server (nodemon / node)
```

Frontend
```bash
cd Frontend
npm install
# set env vars in Frontend/.env (Vite variables needed at build time)
npm run dev
```

---

## Required environment variables
Backend (.env or Vercel project variables)
- MONGODB_URL=<mongodb connection string>
- INNGEST_EVENT_KEY=<inngest event key>
- INNGEST_SIGNING_KEY=<inngest signing key>
- CLERK_PUBLISHABLE_KEY=<clerk publishable key>
- CLERK_SECRET_KEY=<clerk secret key>
- IMAGEKIT_PUBLIC_KEY=<imagekit public key>
- IMAGEKIT_PRIVATE_KEY=<imagekit private key>
- IMAGEKIT_URL_ENDPOINT=<https://ik.imagekit.io/your_path>
- SENDER_EMAIL=<from email address>
- SMTP_USER=<smtp user>
- SMTP_PASS=<smtp password>
- FRONTEND_URL=<https://your-frontend-url>
- NODE_ENV=production

Frontend (.env or Vercel project variables)
- VITE_CLERK_PUBLISHABLE_KEY=<clerk publishable key>
- VITE_BASEURL=<https://your-backend-url>  # used by frontend axios instance at build time

## Useful commands

- Frontend dev: `cd Frontend && npm run dev`
- Backend dev: `cd Backend && npm run dev`
- Linting / tests: (if present) `npm run lint`, `npm test`
